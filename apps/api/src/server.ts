import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { AppConfig } from './config.js';
import {
  getPrismaClient,
  AppRepository,
  AuthAttemptRepository,
  UserRepository,
  SessionRepository,
  WhatsAppSessionRepository,
  AuditLogRepository,
} from '@whatsapp-auth/db';
import { WorkerClientService } from './services/worker-client.service.js';
import { AuthService } from './services/auth.service.js';
import { SSEManager } from './sse/sse-manager.js';
import { SlidingWindowRateLimiter } from '@whatsapp-auth/security';
import { registerAuthRoutes } from './routes/auth.routes.js';
import { registerContinueRoutes } from './routes/continue.routes.js';
import { registerInternalRoutes } from './routes/internal.routes.js';
import { registerAdminRoutes } from './routes/admin.routes.js';
import { AppError, ErrorCode } from '@whatsapp-auth/protocol';

export async function createServer(config: AppConfig): Promise<FastifyInstance> {
  const server = Fastify({
    logger: config.nodeEnv === 'development',
    trustProxy: true,
  });

  // 1. Plugins & Middleware
  await server.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 2. Swagger / OpenAPI Docs
  await server.register(swagger, {
    swagger: {
      info: {
        title: 'WhatsApp Self-Hosted Authentication Core API',
        description:
          'Open-source, self-hosted developer-first WhatsApp passwordless authentication engine.',
        version: '1.0.0',
      },
      host: `localhost:${config.port}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json', 'text/html'],
      tags: [
        { name: 'Authentication', description: 'Core passwordless auth endpoints' },
        { name: 'Administration', description: 'Admin management & dashboard endpoints' },
        { name: 'Internal Worker', description: 'WhatsApp worker integration webhook' },
      ],
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // 3. Public Health Check Endpoint
  server.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'whatsapp-auth-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  });

  // 4. Centralized Error Handler
  server.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }

    server.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: error.message || 'An unexpected internal error occurred',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // 4. Initialize Dependency Graph
  const prisma = getPrismaClient();
  const appRepo = new AppRepository(prisma);
  const attemptRepo = new AuthAttemptRepository(prisma);
  const userRepo = new UserRepository(prisma);
  const sessionRepo = new SessionRepository(prisma);
  const waSessionRepo = new WhatsAppSessionRepository(prisma);
  const auditRepo = new AuditLogRepository(prisma);

  const rateLimiter = new SlidingWindowRateLimiter(config.rateLimitWindowMs, config.rateLimitMaxRequests);
  const sseManager = new SSEManager();
  const workerClient = new WorkerClientService(config.workerUrl, config.workerInternalSecret);
  const authService = new AuthService(
    config,
    appRepo,
    attemptRepo,
    userRepo,
    sessionRepo,
    waSessionRepo,
    auditRepo,
    workerClient,
    sseManager
  );

  // 5. Register Routes
  registerAuthRoutes(server, authService, sseManager, rateLimiter);
  registerContinueRoutes(server, authService);
  registerInternalRoutes(server, config, authService, waSessionRepo, sseManager);
  registerAdminRoutes(
    server,
    config,
    appRepo,
    attemptRepo,
    userRepo,
    sessionRepo,
    waSessionRepo,
    auditRepo,
    workerClient,
    authService,
    sseManager
  );

  return server;
}
