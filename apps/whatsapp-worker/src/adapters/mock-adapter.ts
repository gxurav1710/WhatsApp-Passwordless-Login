import { EventEmitter } from 'node:events';
import { WhatsAppConnectionStatus, IncomingWhatsAppMessage } from '@whatsapp-auth/protocol';
import { normalizePhoneNumber } from '@whatsapp-auth/security';
import { IWhatsAppAdapter, WhatsAppClientInfo, WhatsAppEventHandler } from './whatsapp-adapter.interface.js';
import qrcode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

export interface SentMockMessage {
  to: string;
  message: string;
  timestamp: number;
}

export class MockWhatsAppAdapter implements IWhatsAppAdapter {
  private emitter = new EventEmitter();
  private status: WhatsAppConnectionStatus = WhatsAppConnectionStatus.DISCONNECTED;
  private qrCode: string | null = null;
  private clientInfo: WhatsAppClientInfo | null = null;
  public readonly sentMessages: SentMockMessage[] = [];
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly defaultPhone: string = '+14155550199',
    private readonly autoConnect: boolean = false
  ) {}

  async initialize(): Promise<void> {
    this.setStatus(WhatsAppConnectionStatus.INITIALIZING);

    // Generate a valid mock QR code with simulated session token
    await this.generateNewMockQr();

    // Print to terminal
    console.log('\n============================================================');
    console.log(' [MOCK WHATSAPP WORKER] SIMULATED QR CODE GENERATED:');
    console.log('============================================================');
    try {
      qrcodeTerminal.generate('https://wa.me/14155550199?text=MOCK_AUTH_LOGIN', { small: true });
    } catch {
      // ignore
    }
    console.log(' Live QR available in Dashboard: http://localhost:3000');
    console.log(' (To pair real phone, set WHATSAPP_ADAPTER=whatsapp-web.js in .env)');
    console.log('============================================================\n');

    // Simulate QR code rotation every 20 seconds
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      if (this.status === WhatsAppConnectionStatus.QR_READY) {
        this.generateNewMockQr();
      }
    }, 20000);

    if (this.autoConnect) {
      setTimeout(() => {
        this.simulateConnect();
      }, 5000);
    }
  }

  private async generateNewMockQr(): Promise<void> {
    const mockQrData = `wa_mock_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      const qrDataUrl = await qrcode.toDataURL(mockQrData, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      this.qrCode = qrDataUrl;
    } catch {
      this.qrCode = mockQrData;
    }
    this.setStatus(WhatsAppConnectionStatus.QR_READY);
    this.emitter.emit('qr', this.qrCode);
  }

  public simulateConnect(phoneNumber: string = this.defaultPhone): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.clientInfo = {
      phoneNumber: normalizePhoneNumber(phoneNumber),
      platform: 'mock-simulator',
      pushname: 'Mock Auth Bot',
    };
    this.qrCode = null;
    this.setStatus(WhatsAppConnectionStatus.CONNECTED);
    this.emitter.emit('ready', this.clientInfo);
  }

  async disconnect(): Promise<void> {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.setStatus(WhatsAppConnectionStatus.DISCONNECTED);
    this.clientInfo = null;
    this.qrCode = null;
    this.emitter.emit('disconnected', 'User disconnected');
  }

  getStatus(): WhatsAppConnectionStatus {
    return this.status;
  }

  getQrCode(): string | null {
    return this.qrCode;
  }

  getClientInfo(): WhatsAppClientInfo | null {
    return this.clientInfo;
  }

  async sendMessage(to: string, message: string): Promise<boolean> {
    const normalizedTo = normalizePhoneNumber(to);
    this.sentMessages.push({
      to: normalizedTo,
      message,
      timestamp: Date.now(),
    });
    console.log(`[MOCK WHATSAPP BOT] 📤 Sent message to ${normalizedTo}:\n${message}\n`);
    return true;
  }

  public simulateIncomingMessage(fromPhone: string, body: string): void {
    const normalizedFrom = normalizePhoneNumber(fromPhone);
    const msg: IncomingWhatsAppMessage = {
      from: normalizedFrom,
      body,
      timestamp: Date.now(),
      messageId: `mock_msg_${Date.now()}`,
    };
    this.emitter.emit('message', msg);
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
