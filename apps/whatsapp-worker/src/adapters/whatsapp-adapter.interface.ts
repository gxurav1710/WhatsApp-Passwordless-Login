import { WhatsAppConnectionStatus, IncomingWhatsAppMessage } from '@whatsapp-auth/protocol';

export interface WhatsAppClientInfo {
  phoneNumber?: string | null;
  platform?: string | null;
  pushname?: string | null;
}

export type WhatsAppEventHandler = {
  qr: (qrCode: string) => void;
  ready: (info: WhatsAppClientInfo) => void;
  message: (message: IncomingWhatsAppMessage) => void;
  status: (status: WhatsAppConnectionStatus) => void;
  disconnected: (reason: string) => void;
  error: (err: Error) => void;
};

export interface IWhatsAppAdapter {
  initialize(): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): WhatsAppConnectionStatus;
  getQrCode(): string | null;
  getClientInfo(): WhatsAppClientInfo | null;
  sendMessage(to: string, message: string): Promise<boolean>;

  on<K extends keyof WhatsAppEventHandler>(event: K, handler: WhatsAppEventHandler[K]): void;
  off<K extends keyof WhatsAppEventHandler>(event: K, handler: WhatsAppEventHandler[K]): void;
}
