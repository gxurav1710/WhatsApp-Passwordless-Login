import { EventEmitter } from 'node:events';
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  type WASocket,
  type WAMessage,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import { WhatsAppConnectionStatus, IncomingWhatsAppMessage } from '@whatsapp-auth/protocol';
import { normalizePhoneNumber } from '@whatsapp-auth/security';
import { IWhatsAppAdapter, WhatsAppClientInfo, WhatsAppEventHandler } from './whatsapp-adapter.interface.js';

export function normalizeJidToE164(jid: string): string | null {
  if (!jid || typeof jid !== 'string') return null;

  // Multi-Device JID: e.g. "919876543210:12@s.whatsapp.net" or "919876543210@c.us"
  const userPart = jid.split('@')[0];
  const phonePart = userPart.split(':')[0].replace(/\D/g, '');

  if (!phonePart || phonePart.length < 5) return null;

  try {
    return normalizePhoneNumber(`+${phonePart}`);
  } catch {
    return `+${phonePart}`;
  }
}

export function e164ToBaileysJid(phone: string): string {
  const clean = phone.replace(/\D/g, '').trim();
  return `${clean}@s.whatsapp.net`;
}

export function extractMessageText(msg: WAMessage): string | null {
  if (!msg.message) return null;

  let m: any = msg.message;
  if (m.ephemeralMessage?.message) m = m.ephemeralMessage.message;
  if (m.viewOnceMessage?.message) m = m.viewOnceMessage.message;
  if (m.viewOnceMessageV2?.message) m = m.viewOnceMessageV2.message;
  if (m.viewOnceMessageV2Extension?.message) m = m.viewOnceMessageV2Extension.message;
  if (m.documentWithCaptionMessage?.message) m = m.documentWithCaptionMessage.message;
  if (m.editedMessage?.message) m = m.editedMessage.message;

  if (m.conversation) return m.conversation.trim();
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text.trim();
  if (m.imageMessage?.caption) return m.imageMessage.caption.trim();
  if (m.videoMessage?.caption) return m.videoMessage.caption.trim();
  if (m.documentMessage?.caption) return m.documentMessage.caption.trim();
  if (m.buttonsResponseMessage?.selectedButtonId) return m.buttonsResponseMessage.selectedButtonId.trim();
  if (m.templateButtonReplyMessage?.selectedId) return m.templateButtonReplyMessage.selectedId.trim();
  if (m.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return m.listResponseMessage.singleSelectReply.selectedRowId.trim();
  }

  return null;
}

export class BaileysAdapter implements IWhatsAppAdapter {
  private emitter = new EventEmitter();
  private status: WhatsAppConnectionStatus = WhatsAppConnectionStatus.DISCONNECTED;
  private qrCode: string | null = null;
  private rawQr: string | null = null;
  private clientInfo: WhatsAppClientInfo | null = null;
  private sock: WASocket | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private processedMessageIds = new Set<string>();
  
  // Cache active chat JID & message object for instant quoted reply delivery (matching diagnostic.ts)
  private lastKnownChatJids = new Map<string, string>();
  private lastKnownMsgs = new Map<string, WAMessage>();

  constructor(private readonly sessionDataPath: string = './.baileys_auth') {
    if (!existsSync(this.sessionDataPath)) {
      mkdirSync(this.sessionDataPath, { recursive: true });
    }
    this.loadSavedSessionInfo();
  }

  private loadSavedSessionInfo(): void {
    try {
      const infoFile = join(this.sessionDataPath, 'session-info.json');
      if (existsSync(infoFile)) {
        const raw = readFileSync(infoFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed?.phoneNumber) {
          this.clientInfo = {
            phoneNumber: parsed.phoneNumber,
            pushname: parsed.pushname || 'WhatsApp User',
            platform: 'baileys-multi-device',
          };
          console.log(`[Baileys] 💾 Restored cached identity for ${this.clientInfo.phoneNumber} from ${infoFile}`);
        }
      }
    } catch {
      // ignore
    }
  }

  private saveSessionInfo(): void {
    try {
      if (this.clientInfo) {
        const infoFile = join(this.sessionDataPath, 'session-info.json');
        writeFileSync(infoFile, JSON.stringify(this.clientInfo, null, 2), 'utf8');
      }
    } catch {
      // ignore
    }
  }

  wipeSessionData(): void {
    try {
      if (existsSync(this.sessionDataPath)) {
        rmSync(this.sessionDataPath, { recursive: true, force: true });
        mkdirSync(this.sessionDataPath, { recursive: true });
        console.log(`[Baileys] 🧹 Session directory wiped clean at ${this.sessionDataPath}`);
      }
    } catch (e) {
      console.warn('[Baileys] Warning cleaning session data directory:', e);
    }
  }

  async initialize(): Promise<void> {
    console.log('[Baileys] 🚀 Initializing Baileys WhatsApp WebSocket transport...');
    await this.startSocket();
  }

  async startPairing(): Promise<void> {
    console.log('[Baileys] 🔗 Start pairing requested. Wiping stale session & generating fresh QR code...');
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const oldSock = this.sock;
    this.sock = null;

    if (oldSock) {
      try {
        oldSock.end(undefined);
      } catch {
        // ignore
      }
    }

    this.wipeSessionData();
    this.clientInfo = null;
    this.qrCode = null;
    this.rawQr = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    await this.startSocket();
  }

  private async startSocket(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.isConnecting) {
      console.log('[Baileys] Connection attempt already in progress. Skipping duplicate start.');
      return;
    }
    this.isConnecting = true;

    try {
      if (this.status !== WhatsAppConnectionStatus.CONNECTED) {
        this.setStatus(WhatsAppConnectionStatus.INITIALIZING);
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDataPath);
      const logger = pino({ level: 'silent' });

      const socketInstance = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false,
        logger,
        browser: ['WhatsApp Auth Login', 'Desktop', '1.0.0'],
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
      });

      this.sock = socketInstance;

      socketInstance.ev.on('creds.update', (creds) => {
        if (this.sock !== socketInstance) return;
        saveCreds();
      });

      socketInstance.ev.on('connection.update', async (update) => {
        if (this.sock !== socketInstance) return;

        const { connection, lastDisconnect, qr } = update;

        // 1. QR code received
        if (qr) {
          this.rawQr = qr;
          console.log('\n============================================================');
          console.log(' [BAILEYS WHATSAPP AUTH] SCAN QR CODE TO LINK DEVICE:');
          console.log('============================================================');
          try {
            qrcodeTerminal.generate(qr, { small: true });
          } catch {
            // ignore
          }
          console.log(' Open WhatsApp on phone -> Settings -> Linked Devices -> Link a Device');
          console.log(' (Scan in terminal or in Dashboard at http://localhost:3000)');
          console.log('============================================================\n');

          try {
            const qrDataUrl = await qrcode.toDataURL(qr, {
              width: 320,
              margin: 2,
              errorCorrectionLevel: 'H',
            });
            this.qrCode = qrDataUrl;
          } catch {
            this.qrCode = qr;
          }

          this.setStatus(WhatsAppConnectionStatus.QR_READY);
          this.emitter.emit('qr', this.qrCode);
        }

        // 2. Connection state changes
        if (connection === 'connecting') {
          console.log('[Baileys] ⏳ Connection: connecting to WhatsApp WebSocket...');
        } else if (connection === 'open') {
          this.reconnectAttempts = 0;
          this.qrCode = null;
          this.rawQr = null;

          const rawId = socketInstance.user?.id || socketInstance.user?.lid || '';
          const phone = normalizeJidToE164(rawId) || this.clientInfo?.phoneNumber || null;

          this.clientInfo = {
            phoneNumber: phone,
            pushname: socketInstance.user?.name || 'WhatsApp User',
            platform: 'baileys-multi-device',
          };

          this.saveSessionInfo();
          this.setStatus(WhatsAppConnectionStatus.CONNECTED);
          console.log(`[Baileys] 🟢 Connection: open! Authenticated number: ${this.clientInfo.phoneNumber} (${this.clientInfo.pushname})`);
          this.emitter.emit('ready', this.clientInfo);
        } else if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403;
          const isBadSession = statusCode === DisconnectReason.badSession || statusCode === 500;
          const shouldReconnect = !isLoggedOut && !isBadSession;

          console.log(`[Baileys] 🔴 Connection closed. Status code: ${statusCode}, shouldReconnect: ${shouldReconnect}`);

          if (isLoggedOut || isBadSession) {
            console.log('[Baileys] ⚠️ Session is invalid or logged out. Cleaning stored credentials...');
            this.wipeSessionData();
            this.clientInfo = null;
            this.qrCode = null;
            this.rawQr = null;
            this.setStatus(WhatsAppConnectionStatus.DISCONNECTED);
            this.emitter.emit('disconnected', 'Logged out or bad session');

            console.log('[Baileys] 🔄 Starting fresh socket for pairing QR code...');
            setTimeout(() => {
              this.startSocket().catch((err) => {
                console.error('[Baileys] Error starting fresh socket:', err);
              });
            }, 800);
          } else {
            this.setStatus(WhatsAppConnectionStatus.DISCONNECTED);
            this.emitter.emit('disconnected', `Disconnected (${statusCode || 'Unknown reason'})`);

            if (shouldReconnect) {
              this.reconnectAttempts++;
              const delayMs = Math.min(this.reconnectAttempts * 2000, 10000);
              console.log(`[Baileys] 🔄 Scheduling auto-reconnect in ${delayMs}ms (attempt ${this.reconnectAttempts})...`);
              this.reconnectTimer = setTimeout(() => {
                this.startSocket().catch((err) => {
                  console.error('[Baileys] Error during auto-reconnect:', err);
                });
              }, delayMs);
            }
          }
        }
      });

      // 3. Inbound message handling via messages.upsert
      socketInstance.ev.on('messages.upsert', async ({ messages, type }) => {
        if (this.sock !== socketInstance) return;
        if (type !== 'notify' && type !== 'append') return;

        for (const msg of messages) {
          if (!msg || !msg.message) continue;

          const text = extractMessageText(msg);
          if (!text) continue;

          const rawRemoteJid = msg.key.remoteJid || '';
          const msgId = msg.key.id || `${rawRemoteJid}_${msg.messageTimestamp}_${text}`;
          if (this.processedMessageIds.has(msgId)) continue;
          this.processedMessageIds.add(msgId);
          if (this.processedMessageIds.size > 500) {
            const first = this.processedMessageIds.values().next().value;
            if (first) this.processedMessageIds.delete(first);
          }

          // Ignore outgoing bot responses to prevent loop
          if (text.includes('WhatsApp Authentication') || text.includes('Click this secure link')) {
            continue;
          }

          // Determine sender JID
          const senderJid = msg.key.fromMe
            ? rawRemoteJid
            : (msg.key.participant || rawRemoteJid);

          if (!rawRemoteJid || rawRemoteJid.endsWith('@g.us') || rawRemoteJid === 'status@broadcast') {
            continue;
          }

          const senderPhone = normalizeJidToE164(senderJid);
          if (!senderPhone) continue;

          const cleanPhone = senderPhone.replace(/\D/g, '');

          // Cache active chat thread JID & message object for instant quoted reply delivery
          this.lastKnownChatJids.set(senderPhone, rawRemoteJid);
          this.lastKnownChatJids.set(cleanPhone, rawRemoteJid);
          this.lastKnownMsgs.set(senderPhone, msg);
          this.lastKnownMsgs.set(cleanPhone, msg);

          console.log(`[Baileys] 📩 Inbound message from ${senderPhone}: "${text}" (Chat: ${rawRemoteJid}, id: ${msg.key.id})`);

          const incomingMsg: IncomingWhatsAppMessage = {
            from: senderPhone,
            body: text,
            timestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now(),
            messageId: msg.key.id || `bmsg_${Date.now()}`,
          };

          this.emitter.emit('message', incomingMsg);
        }
      });
    } catch (err: any) {
      console.error('[Baileys] ❌ Error in startSocket:', err);
      if (this.status !== WhatsAppConnectionStatus.CONNECTED) {
        this.setStatus(WhatsAppConnectionStatus.FAILED);
      }
      this.emitter.emit('error', err);
    } finally {
      this.isConnecting = false;
    }
  }

  async logout(): Promise<void> {
    console.log('[Baileys] 🛑 User requested logout. Terminating session & generating fresh QR...');
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const oldSock = this.sock;
    this.sock = null;

    if (oldSock) {
      try {
        await oldSock.logout();
      } catch {
        // ignore
      }
      try {
        oldSock.end(undefined);
      } catch {
        // ignore
      }
    }

    this.wipeSessionData();
    this.clientInfo = null;
    this.qrCode = null;
    this.rawQr = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.setStatus(WhatsAppConnectionStatus.DISCONNECTED);
    this.emitter.emit('disconnected', 'Logged out');

    // Immediately start fresh pairing socket so a new QR is ready for the dashboard
    setTimeout(() => {
      this.startSocket().catch((err) => {
        console.error('[Baileys] Error starting fresh pairing socket after logout:', err);
      });
    }, 400);
  }

  async disconnect(): Promise<void> {
    await this.logout();
  }

  getStatus(): WhatsAppConnectionStatus {
    return this.status;
  }

  getQrCode(): string | null {
    return this.qrCode || this.rawQr;
  }

  getClientInfo(): WhatsAppClientInfo | null {
    if (this.status !== WhatsAppConnectionStatus.CONNECTED) {
      return null;
    }
    return this.clientInfo;
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    if (!this.sock || this.status !== WhatsAppConnectionStatus.CONNECTED) {
      throw new Error('Cannot send message: Baileys is not connected');
    }

    const cleanPhone = to.replace(/\D/g, '').trim();
    const normalizedPhone = `+${cleanPhone}`;

    // 1. Resolve target JID: Prefer active chat thread JID (from incoming message), fallback to clean @s.whatsapp.net
    const activeChatJid = this.lastKnownChatJids.get(normalizedPhone) || this.lastKnownChatJids.get(cleanPhone);
    const targetJid = activeChatJid || `${cleanPhone}@s.whatsapp.net`;
    const quotedMsg = this.lastKnownMsgs.get(normalizedPhone) || this.lastKnownMsgs.get(cleanPhone);

    console.log(`[Baileys] 📤 Delivering magic login link to ${targetJid}...`);
    try {
      // 2. Presence and typing sync handshake for instant delivery (matching diagnostic.ts)
      await this.sock.presenceSubscribe(targetJid);
      await this.sock.sendPresenceUpdate('composing', targetJid);
      await new Promise((r) => setTimeout(r, 100));

      const sent = await this.sock.sendMessage(
        targetJid,
        { text: message },
        quotedMsg ? { quoted: quotedMsg } : undefined
      );
      console.log(`[Baileys] ✅ Delivered magic login link to ${targetJid} (Msg ID: ${sent?.key?.id})`);
      return true;
    } catch (err: any) {
      console.error(`[Baileys] ❌ Failed to send message to ${targetJid}:`, err.message);
      throw err;
    }
  }

  private setStatus(status: WhatsAppConnectionStatus): void {
    this.status = status;
    this.emitter.emit('status', status);
  }

  on<K extends keyof WhatsAppEventHandler>(event: K, handler: WhatsAppEventHandler[K]): void {
    this.emitter.on(event, handler as any);
  }

  off<K extends keyof WhatsAppEventHandler>(event: K, handler: WhatsAppEventHandler[K]): void {
    this.emitter.off(event, handler as any);
  }
}
