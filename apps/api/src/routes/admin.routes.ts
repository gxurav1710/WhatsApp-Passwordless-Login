import { FastifyInstance } from 'fastify';
import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
  SimulateMessageRequestSchema,
} from '@whatsapp-auth/protocol';
import {
  AppRepository,
  AuthAttemptRepository,
  UserRepository,
  SessionRepository,
  WhatsAppSessionRepository,
  AuditLogRepository,
} from '@whatsapp-auth/db';
import { WorkerClientService } from '../services/worker-client.service.js';
import { AuthService } from '../services/auth.service.js';
import { SSEManager } from '../sse/sse-manager.js';
import { AppConfig } from '../config.js';

export function registerAdminRoutes(
  server: FastifyInstance,
  config: AppConfig,
  appRepo: AppRepository,
  attemptRepo: AuthAttemptRepository,
  userRepo: UserRepository,
  sessionRepo: SessionRepository,
  waSessionRepo: WhatsAppSessionRepository,
  auditRepo: AuditLogRepository,
  workerClient: WorkerClientService,
  authService: AuthService,
  sseManager: SSEManager
) {
  // 1. System Health Check
  server.get('/api/v1/admin/health', async () => {
    let dbOk = false;
    try {
      await appRepo.list();
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const workerStatus = await workerClient.getStatus();
    const session = await waSessionRepo.getSession('default');

    let status = workerStatus.status || 'DISCONNECTED';
    let phoneNumber = workerStatus.phoneNumber || session?.phoneNumber || null;

    if (workerStatus.status === 'CONNECTED' || workerStatus.status === 'AUTHENTICATED' || (session?.status === 'CONNECTED' && phoneNumber)) {
      status = 'CONNECTED';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: { status: 'healthy', version: '1.0.0' },
        database: { status: dbOk ? 'healthy' : 'unhealthy' },
        worker: { status: workerStatus.error ? 'unhealthy' : 'healthy', mode: workerStatus.adapterMode },
        whatsapp: {
          status,
          phoneNumber,
          platform: workerStatus.platform || session?.platform || null,
        },
      },
    };
  });

  // 2. Overview Metrics & Statistics
  server.get('/api/v1/admin/overview', async () => {
    try {
      const apps = await appRepo.list();
      const users = await userRepo.list({ limit: 1000 });
      const recentAttempts = await attemptRepo.listRecent({ limit: 100 });
      const activeSessions = await sessionRepo.listActive({ limit: 1000 });

      const totalAttempts = recentAttempts.length;
      const successfulAttempts = recentAttempts.filter((a) => a.state === 'COMPLETED').length;
      const successRate = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 100;

      return {
        success: true,
        data: {
          totalApplications: apps.length,
          totalUsers: users.length,
          activeSessions: activeSessions.length,
          recentAttemptsCount: totalAttempts,
          successRatePercentage: successRate,
        },
      };
    } catch (e: any) {
      return {
        success: false,
        error: e.message,
        data: {
          totalApplications: 0,
          totalUsers: 0,
          activeSessions: 0,
          recentAttemptsCount: 0,
          successRatePercentage: 100,
        },
      };
    }
  });

  // 3. Applications CRUD
  server.get('/api/v1/admin/apps', async () => {
    try {
      const apps = await appRepo.list();
      const sanitized = apps.map((a) => ({
        id: a.id,
        name: a.name,
        clientId: a.clientId,
        authServerUrl: (a as any).authServerUrl || null,
        redirectUris: a.redirectUris,
        webhookUrl: a.webhookUrl,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));
      return { success: true, data: sanitized };
    } catch (err: any) {
      return { success: false, error: err.message, data: [] };
    }
  });

  server.post('/api/v1/admin/apps', async (request, reply) => {
    const parsed = CreateApplicationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.format() });
    }

    try {
      const { app, plainClientSecret } = await appRepo.create({
        name: parsed.data.name,
        authServerUrl: parsed.data.auth_server_url,
        redirectUris: parsed.data.redirect_uris,
        webhookUrl: parsed.data.webhook_url,
        status: parsed.data.status,
      });

      await auditRepo.log({
        eventType: 'APP_CREATED',
        applicationId: app.id,
        details: { name: app.name, clientId: app.clientId },
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: app.id,
          name: app.name,
          clientId: app.clientId,
          clientSecret: plainClientSecret,
          authServerUrl: (app as any).authServerUrl || null,
          redirectUris: app.redirectUris,
          webhookUrl: app.webhookUrl,
          status: app.status,
          createdAt: app.createdAt,
        },
      });
    } catch (err: any) {
      server.log.error(err);
      return reply.status(500).send({
        success: false,
        error: { message: err.message || 'Failed to create application in database' },
      });
    }
  });

  server.patch('/api/v1/admin/apps/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateApplicationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.format() });
    }

    try {
      const updated = await appRepo.update(id, {
        name: parsed.data.name,
        redirectUris: parsed.data.redirect_uris,
        webhookUrl: parsed.data.webhook_url,
        status: parsed.data.status,
      });
      return reply.send({ success: true, data: updated });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: { message: err.message } });
    }
  });

  server.delete('/api/v1/admin/apps/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await appRepo.delete(id);
      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: { message: err.message } });
    }
  });

  server.post('/api/v1/admin/apps/:id/rotate-secret', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const { app, plainClientSecret } = await appRepo.rotateSecret(id);

      await auditRepo.log({
        eventType: 'APP_SECRET_ROTATED',
        applicationId: app.id,
      });

      return reply.send({
        success: true,
        data: {
          id: app.id,
          clientId: app.clientId,
          clientSecret: plainClientSecret,
        },
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: { message: err.message } });
    }
  });

  // 4. WhatsApp Status & Controls
  server.get('/api/v1/admin/whatsapp/status', async () => {
    const workerStatus = await workerClient.getStatus();
    const session = await waSessionRepo.getSession('default');

    let status = workerStatus.status || 'DISCONNECTED';
    let phoneNumber = workerStatus.phoneNumber || session?.phoneNumber || null;
    const platform = workerStatus.platform || session?.platform || null;
    const qrCode = workerStatus.qrCode || null;

    if (workerStatus.status === 'CONNECTED' || workerStatus.status === 'AUTHENTICATED' || (session?.status === 'CONNECTED' && phoneNumber)) {
      status = 'CONNECTED';
    }

    return {
      success: true,
      data: {
        status,
        phoneNumber,
        platform,
        qrCode,
        adapterMode: workerStatus.adapterMode || 'mock',
      },
    };
  });

  // On-demand start pairing (opens visible Chrome window with official WhatsApp Web)
  server.post('/api/v1/admin/whatsapp/start-pairing', async (request) => {
    const body = (request.body as { visual?: boolean }) || {};
    const result = await workerClient.startPairing(body.visual !== false);
    return { success: true, result };
  });

  // WhatsApp Session Logout & Credential Reset
  server.post('/api/v1/admin/whatsapp/logout', async () => {
    try {
      await waSessionRepo.updateStatus('default', {
        status: 'DISCONNECTED' as any,
        phoneNumber: null,
        qrCode: null,
      });
    } catch {
      // ignore
    }

    sseManager.emitWhatsAppStatus({
      status: 'DISCONNECTED' as any,
      phoneNumber: null,
      qrCode: null,
      timestamp: new Date().toISOString(),
    });

    const result = await workerClient.logout();
    return { success: true, result };
  });

  server.post('/api/v1/admin/whatsapp/reconnect', async () => {
    const result = await workerClient.reconnect();
    return { success: true, result };
  });

  // 5. Auth Attempt & Audit Logs
  server.get('/api/v1/admin/logs/auth', async (request) => {
    const query = request.query as {
      applicationId?: string;
      phoneNumber?: string;
      state?: any;
      limit?: string;
    };

    const attempts = await attemptRepo.listRecent({
      applicationId: query.applicationId,
      phoneNumber: query.phoneNumber,
      state: query.state,
      limit: query.limit ? Number(query.limit) : 50,
    });

    return { success: true, data: attempts };
  });

  server.get('/api/v1/admin/logs/audit', async (request) => {
    const query = request.query as { applicationId?: string; eventType?: string; limit?: string };
    const logs = await auditRepo.listRecent({
      applicationId: query.applicationId,
      eventType: query.eventType,
      limit: query.limit ? Number(query.limit) : 100,
    });

    return { success: true, data: logs };
  });

  // 6. Users & Sessions
  server.get('/api/v1/admin/users', async (request) => {
    const query = request.query as { search?: string; limit?: string; skip?: string };
    const searchVal =
      query.search && query.search !== 'undefined' && query.search.trim() !== ''
        ? query.search.trim()
        : undefined;
    const users = await userRepo.list({
      search: searchVal,
      limit: query.limit ? Number(query.limit) : 50,
      skip: query.skip ? Number(query.skip) : 0,
    });

    return { success: true, data: users };
  });

  server.get('/api/v1/admin/sessions', async (request) => {
    const query = request.query as { applicationId?: string; userId?: string; limit?: string };
    const sessions = await sessionRepo.listActive({
      applicationId: query.applicationId,
      userId: query.userId,
      limit: query.limit ? Number(query.limit) : 50,
    });

    return { success: true, data: sessions };
  });

  server.delete('/api/v1/admin/sessions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await sessionRepo.revoke(id);
    return reply.send({ success: true });
  });

  // 7. Interactive Test Simulator Endpoint
  server.post('/api/v1/admin/test/simulate', async (request, reply) => {
    const parsed = SimulateMessageRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: parsed.error.format() });
    }

    const handled = await authService.handleIncomingWhatsAppMessage({
      from: parsed.data.phone_number,
      body: parsed.data.message_body,
    });

    await workerClient.simulateIncomingMessage(parsed.data.phone_number, parsed.data.message_body);

    return reply.send({
      success: true,
      message: 'Simulated WhatsApp message processed',
      matchedAuthAttempt: handled,
    });
  });

  // 8. Real-time Dashboard Events SSE Stream
  server.get('/api/v1/admin/events', async (request, reply) => {
    const subId = `dash_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    sseManager.addSubscriber(subId, reply, { isDashboard: true });
  });
}
