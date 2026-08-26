import { existsSync, mkdirSync } from 'node:fs';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  type WAMessage,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import qrcodeTerminal from 'qrcode-terminal';
import { normalizePhoneNumber } from '@whatsapp-auth/security';

export function normalizeJidToE164(jid: string): string | null {
  if (!jid || typeof jid !== 'string') return null;
  const userPart = jid.split('@')[0];
  const phonePart = userPart.split(':')[0].replace(/\D/g, '');
  if (!phonePart || phonePart.length < 5) return null;
  try {
    return normalizePhoneNumber(`+${phonePart}`);
  } catch {
    return `+${phonePart}`;
  }
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

const sessionPath = process.env.WHATSAPP_SESSION_PATH || './.baileys_auth';
if (!existsSync(sessionPath)) {
  mkdirSync(sessionPath, { recursive: true });
}

console.log('\n============================================================');
console.log('       WHATSAPP TRANSPORT STANDALONE DIAGNOSTIC TOOL       ');
console.log('============================================================');
console.log(` Session directory: ${sessionPath}`);
console.log(' Connecting to WhatsApp WebSocket servers...\n');

async function runDiagnostic() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    logger,
    browser: ['WhatsApp Diagnostic', 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n[DIAGNOSTIC] 📲 QR CODE READY. Scan with Account A to link device:');
      try {
        qrcodeTerminal.generate(qr, { small: true });
      } catch {
        console.log(` Raw QR String: ${qr}`);
      }
    }

    if (connection === 'connecting') {
      console.log('[DIAGNOSTIC] ⏳ Connection status: CONNECTING...');
    } else if (connection === 'open') {
      const rawId = sock.user?.id || sock.user?.lid || '';
      const phone = normalizeJidToE164(rawId);

      console.log('\n============================================================');
      console.log(' ✅ [DIAGNOSTIC] WHATSAPP CONNECTION IS OPEN AND ACTIVE!');
      console.log(`    Account A Number: ${phone || rawId}`);
      console.log(`    Account Name:     ${sock.user?.name || 'WhatsApp User'}`);
      console.log('============================================================');
      console.log(' 🟢 READY FOR ECHO TEST:');
      console.log(`    Send any message (e.g. "hello") from Account B to ${phone || 'Account A'}.`);
      console.log('    The diagnostic will log the message and reply "✅ RECEIVED".');
      console.log('============================================================\n');
    } else if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[DIAGNOSTIC] 🔴 Connection closed. Status code: ${statusCode}, shouldReconnect: ${shouldReconnect}`);
      if (shouldReconnect) {
        console.log('[DIAGNOSTIC] 🔄 Reconnecting in 3 seconds...');
        setTimeout(runDiagnostic, 3000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    console.log(`\n[DIAGNOSTIC EVENT] ⚡ messages.upsert received! (Type: ${type}, Count: ${messages.length})`);

    for (const msg of messages) {
      if (!msg || !msg.message) {
        continue;
      }

      const text = extractMessageText(msg);
      const rawRemoteJid = msg.key.remoteJid || '';
      const rawParticipant = msg.key.participant || '';
      const fromMe = msg.key.fromMe || false;
      const senderJid = fromMe ? rawRemoteJid : (rawParticipant || rawRemoteJid);
      const senderPhone = normalizeJidToE164(senderJid);

      console.log('------------------------------------------------------------');
      console.log(' [DIAGNOSTIC] 📩 INCOMING MESSAGE DETAILS:');
      console.log(`   • Remote JID (Chat): ${rawRemoteJid}`);
      console.log(`   • Sender Raw JID:    ${senderJid}`);
      console.log(`   • Sender Phone:      ${senderPhone}`);
      console.log(`   • Message ID:        ${msg.key.id}`);
      console.log(`   • fromMe:            ${fromMe}`);
      console.log(`   • Timestamp:         ${msg.messageTimestamp} (${new Date(Number(msg.messageTimestamp) * 1000).toLocaleTimeString()})`);
      console.log(`   • Extracted Text:    "${text || '<Non-text message>'}"`);
      console.log('------------------------------------------------------------');

      // Ignore our own echo reply to prevent infinite loop
      if (text === '✅ RECEIVED' || (text && text.includes('WhatsApp Authentication'))) {
        console.log('  - [DIAGNOSTIC] Ignored outgoing/echo message.');
        continue;
      }

      if (!rawRemoteJid || rawRemoteJid.endsWith('@g.us') || rawRemoteJid === 'status@broadcast') {
        console.log('  - [DIAGNOSTIC] Ignored group or status broadcast message.');
        continue;
      }

      if (text && rawRemoteJid) {
        console.log(` [DIAGNOSTIC] 📤 Replying "✅ RECEIVED" to chat ${rawRemoteJid}...`);
        try {
          // Subscribe presence & send typing indicator for reliable session key synchronization
          await sock.presenceSubscribe(rawRemoteJid);
          await sock.sendPresenceUpdate('composing', rawRemoteJid);
          await new Promise((r) => setTimeout(r, 150));

          const sentMsg = await sock.sendMessage(rawRemoteJid, { text: '✅ RECEIVED' }, { quoted: msg });
          console.log(` [DIAGNOSTIC] ✅ Echo reply successfully delivered to ${rawRemoteJid}! (Message ID: ${sentMsg?.key?.id})`);
        } catch (err: any) {
          console.error(` [DIAGNOSTIC] ❌ Failed to send echo reply:`, err.message);
        }
      }
    }
  });
}

runDiagnostic().catch((err) => {
  console.error('[DIAGNOSTIC] Fatal error:', err);
});
