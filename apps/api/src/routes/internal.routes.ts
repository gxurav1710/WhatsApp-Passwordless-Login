import { FastifyInstance } from 'fastify';
import {
  IncomingWhatsAppMessageSchema,
  WorkerStatusUpdateSchema,
} from '@whatsapp-auth/protocol';
import { AuthService } from '../services/auth.service.js';
import { WhatsAppSessionRepository } from '@whatsapp-auth/db';
import { SSEManager } from '../sse/sse-manager.js';
import { AppConfig } from '../config.js';

export function registerInternalRoutes(
  server: FastifyInstance,
  config: AppConfig,
  authService: AuthService,
  waSessionRepo: WhatsAppSessionRepository,
  sseManager: SSEManager
) {
  // Middleware to authenticate internal worker requests
  const verifyWorkerAuth = async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token || token !== config.workerInternalSecret) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid worker internal secret' });
    }
  };

  // 1. Webhook for incoming WhatsApp messages
  server.post(
    '/api/v1/internal/whatsapp/webhook',
    {
      preHandler: [verifyWorkerAuth],
      schema: {
        description: 'Internal webhook receiving incoming WhatsApp messages from the worker',
        tags: ['Internal'],
      },
    },
    async (request, reply) => {
      const parsed = IncomingWhatsAppMessageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      const handled = await authService.handleIncomingWhatsAppMessage(parsed.data);
      return reply.send({ success: true, matchedAttempt: handled });
    }
  );

  // 2. Status update from WhatsApp worker
  server.post(
    '/api/v1/internal/whatsapp/status',
    {
      preHandler: [verifyWorkerAuth],
      schema: {
        description: 'Internal endpoint for worker to report connection and QR status',
        tags: ['Internal'],
      },
    },
    async (request, reply) => {
      const parsed = WorkerStatusUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.format() });
      }

      // Update database session record safely
      try {
        await waSessionRepo.updateStatus('default', {
          status: parsed.data.status,
          phoneNumber: parsed.data.phoneNumber,
          qrCode: parsed.data.qrCode,
          platform: parsed.data.platform,
        });
      } catch (err) {
        server.log.warn({ err }, 'Failed to persist WhatsApp session to DB (continuing in-memory)');
      }

      // Emit real-time update to dashboard SSE listeners
      sseManager.emitWhatsAppStatus({
        status: parsed.data.status,
        phoneNumber: parsed.data.phoneNumber,
        qrCode: parsed.data.qrCode,
        timestamp: new Date().toISOString(),
      });

      return reply.send({ success: true });
    }
  );
}
