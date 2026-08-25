import { FastifyInstance } from 'fastify';
import {
  InitiateAuthRequestSchema,
  TokenExchangeRequestSchema,
  VerifySessionRequestSchema,
} from '@whatsapp-auth/protocol';
import { AuthService } from '../services/auth.service.js';
import { SSEManager } from '../sse/sse-manager.js';
import { SlidingWindowRateLimiter } from '@whatsapp-auth/security';

export function registerAuthRoutes(
  server: FastifyInstance,
  authService: AuthService,
  sseManager: SSEManager,
  rateLimiter: SlidingWindowRateLimiter
) {
  // 1. Initiate Authentication Attempt
  server.post(
    '/api/v1/auth/initiate',
    {
      schema: {
        description: 'Initiate passwordless WhatsApp authentication for a phone number',
        tags: ['Authentication'],
      },
    },
    async (request, reply) => {
      // Rate limiting by IP and Phone
      const clientIp = request.ip;
      const ipCheck = rateLimiter.check(`ip:${clientIp}`, 20);
      if (!ipCheck.allowed) {
        return reply.status(429).send({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many requests. Please retry in ${Math.ceil(ipCheck.resetMs / 1000)} seconds.`,
          },
        });
      }

      const parsed = InitiateAuthRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parsed.error.format(),
          },
        });
      }

      const phoneCheck = rateLimiter.check(`phone:${parsed.data.phone_number}`, 5);
      if (!phoneCheck.allowed) {
        return reply.status(429).send({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many authentication attempts for this phone number. Please wait before retrying.',
          },
        });
      }

      const result = await authService.initiateAuth(parsed.data, {
        ipAddress: clientIp,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({ success: true, data: result });
    }
  );

  // 2. Real-Time SSE Stream for Auth Attempt Updates
  server.get(
    '/api/v1/auth/events/:attemptId',
    {
      schema: {
        description: 'Subscribe to real-time status updates for an authentication attempt',
        tags: ['Authentication'],
      },
    },
    async (request, reply) => {
      const { attemptId } = request.params as { attemptId: string };
      const subId = `sub_${attemptId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      sseManager.addSubscriber(subId, reply, { attemptId });
    }
  );

  // 3. OAuth 2.0 Authorization Code Exchange
  server.post(
    '/api/v1/auth/token',
    {
      schema: {
        description: 'Exchange single-use authorization code for authenticated user token',
        tags: ['Authentication'],
      },
    },
    async (request, reply) => {
      const parsed = TokenExchangeRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid token exchange request',
            details: parsed.error.format(),
          },
        });
      }

      const result = await authService.exchangeCode(parsed.data, {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({ success: true, data: result });
    }
  );

  // 4. Introspect / Verify Existing Session
  server.post(
    '/api/v1/auth/verify-session',
    {
      schema: {
        description: 'Verify and introspect an existing session token',
        tags: ['Authentication'],
      },
    },
    async (request, reply) => {
      const parsed = VerifySessionRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid session verification request',
          },
        });
      }

      const result = await authService.verifySession(parsed.data.token);
      return reply.send({ success: true, data: result });
    }
  );
}
