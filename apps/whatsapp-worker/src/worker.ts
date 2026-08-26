import Fastify, { FastifyInstance } from 'fastify';
import {
  WhatsAppConnectionStatus,
  IncomingWhatsAppMessage,
  WorkerStatusUpdate,
  SendWhatsAppMessageCommandSchema,
} from '@whatsapp-auth/protocol';
import { IWhatsAppAdapter, WhatsAppClientInfo } from './adapters/whatsapp-adapter.interface.js';
import { BaileysAdapter } from './adapters/baileys-adapter.js';
import { MockWhatsAppAdapter } from './adapters/mock-adapter.js';

export interface WorkerServiceConfig {
  port: number;
  authApiUrl: string;
  workerSecret: string;
  adapterMode: 'mock' | 'baileys' | 'whatsapp-web.js';
  sessionDataPath?: string;
  headless?: boolean;
}

export class WhatsAppWorkerService {
  private server: FastifyInstance;
  private adapter: IWhatsAppAdapter;

  constructor(private readonly config: WorkerServiceConfig) {
    this.server = Fastify({ logger: true });

    if (config.adapterMode === 'mock') {
      this.adapter = new MockWhatsAppAdapter();
    } else {
      this.adapter = new BaileysAdapter(config.sessionDataPath || './.baileys_auth');
    }

    this.setupAdapterListeners();
    this.setupRoutes();
  }

  private setupAdapterListeners(): void {
    this.adapter.on('qr', (qrCode) => {
      this.notifyApiStatus({
        status: WhatsAppConnectionStatus.QR_READY,
        qrCode,
        timestamp: Date.now(),
      });
    });

    this.adapter.on('ready', (info: WhatsAppClientInfo) => {
      this.notifyApiStatus({
        status: WhatsAppConnectionStatus.CONNECTED,
        phoneNumber: info.phoneNumber,
        platform: info.platform || 'baileys-multi-device',
        timestamp: Date.now(),
      });
    });

    this.adapter.on('status', (status) => {
      const info = this.adapter.getClientInfo();
      this.notifyApiStatus({
        status,
        phoneNumber: info?.phoneNumber,
        qrCode: this.adapter.getQrCode(),
        timestamp: Date.now(),
      });
    });

    this.adapter.on('disconnected', () => {
      this.notifyApiStatus({
        status: WhatsAppConnectionStatus.DISCONNECTED,
        timestamp: Date.now(),
      });
    });

    this.adapter.on('message', async (msg: IncomingWhatsAppMessage) => {
      await this.notifyApiIncomingMessage(msg);
    });

    this.adapter.on('error', (err) => {
      this.server.log.error({ err }, 'WhatsApp Adapter Error');
    });
  }

  private async notifyApiStatus(payload: WorkerStatusUpdate): Promise<void> {
    try {
      const url = `${this.config.authApiUrl}/api/v1/internal/whatsapp/status`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.workerSecret}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      this.server.log.warn({ err }, 'Failed to notify Auth API of status change');
    }
  }

  private async notifyApiIncomingMessage(msg: IncomingWhatsAppMessage): Promise<void> {
    try {
      const url = `${this.config.authApiUrl}/api/v1/internal/whatsapp/webhook`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.workerSecret}`,
        },
        body: JSON.stringify(msg),
      });
    } catch (err) {
      this.server.log.error({ err }, 'Failed to forward incoming WhatsApp message to Auth API');
    }
  }

  private setupRoutes(): void {
    // Shared secret authentication middleware for internal commands
    this.server.addHook('preHandler', async (request, reply) => {
      if (request.url === '/health') return;

      const authHeader = request.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token || token !== this.config.workerSecret) {
        return reply.status(401).send({ error: 'Unauthorized: invalid worker secret' });
      }
    });

    // Health check
    this.server.get('/health', async () => {
      return {
        status: 'healthy',
        adapterStatus: this.adapter.getStatus(),
        adapterMode: this.config.adapterMode,
        timestamp: new Date().toISOString(),
      };
    });

    // Status endpoint
    this.server.get('/internal/status', async () => {
      const info = this.adapter.getClientInfo();
      return {
        status: this.adapter.getStatus(),
        phoneNumber: info?.phoneNumber,
        platform: info?.platform,
        qrCode: this.adapter.getQrCode(),
        adapterMode: this.config.adapterMode,
      };
    });

    // Start Pairing (regenerates QR code for linking device)
    this.server.post('/internal/start-pairing', async () => {
      if (this.adapter instanceof BaileysAdapter) {
        await this.adapter.startPairing();
        return { success: true, status: this.adapter.getStatus() };
      } else if (this.adapter instanceof MockWhatsAppAdapter) {
        await this.adapter.initialize();
        return { success: true, status: this.adapter.getStatus() };
      }

      return { success: false, error: 'Unknown adapter' };
    });

    // Logout endpoint (clears credentials and disconnects)
    this.server.post('/internal/logout', async () => {
      if (this.adapter instanceof BaileysAdapter) {
        await this.adapter.logout();
      } else {
        await this.adapter.disconnect();
      }
      return { success: true, status: this.adapter.getStatus() };
    });

    // Send Message command from Auth API
    this.server.post('/internal/send', async (request, reply) => {
      const parsed = SendWhatsAppMessageCommandSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      try {
        const result = await this.adapter.sendMessage(parsed.data.to, parsed.data.message);
        return { success: result };
      } catch (err: any) {
        this.server.log.error({ err }, 'Failed to send WhatsApp message');
        return reply.status(500).send({ error: err.message || 'Failed to send WhatsApp message' });
      }
    });

    // Reconnect command
    this.server.post('/internal/reconnect', async () => {
      if (this.adapter instanceof BaileysAdapter) {
        await this.adapter.startPairing();
      } else {
        await this.adapter.disconnect();
        await this.adapter.initialize();
      }
      return { success: true, status: this.adapter.getStatus() };
    });

    // Simulate Message endpoint
    this.server.post('/internal/simulate', async (request, reply) => {
      const body = request.body as { from: string; body: string };
      if (!body.from || !body.body) {
        return reply.status(400).send({ error: 'from and body are required' });
      }

      if (this.adapter instanceof MockWhatsAppAdapter) {
        this.adapter.simulateIncomingMessage(body.from, body.body);
        return { success: true, simulated: true };
      }

      return reply.status(400).send({ error: 'Simulation only available with MockWhatsAppAdapter' });
    });
  }

  async start(): Promise<void> {
    await this.server.listen({ port: this.config.port, host: '0.0.0.0' });
    await this.adapter.initialize();
  }

  async stop(): Promise<void> {
    await this.adapter.disconnect();
    await this.server.close();
  }
}
