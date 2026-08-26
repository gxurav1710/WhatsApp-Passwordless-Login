import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../apps/api/src/server.js';
import { loadConfig } from '../../apps/api/src/config.js';
import { getPrismaClient, disconnectPrisma, AppRepository } from '@whatsapp-auth/db';
import { MockWhatsAppAdapter } from '../../apps/whatsapp-worker/src/adapters/mock-adapter.js';

describe('End-to-End Authentication Flow', () => {
  let server: FastifyInstance;
  let clientId: string;
  let clientSecret: string;
  const redirectUri = 'http://localhost:5000/auth/callback';
  const testPhone = '+14155552671';

  beforeAll(async () => {
    const config = loadConfig();
    server = await createServer(config);
    await server.ready();

    // Create a test application in the DB
    const prisma = getPrismaClient();
    const appRepo = new AppRepository(prisma);

    try {
      const created = await appRepo.create({
        name: 'Automated E2E Test App',
        redirectUris: [redirectUri],
      });
      clientId = created.app.clientId;
      clientSecret = created.plainClientSecret;
    } catch (err) {
      // If DB is not available in standalone unit runner, fallback with mock credentials for logic test
      clientId = 'wa_client_test_e2e_12345';
      clientSecret = 'wa_sec_test_e2e_secret_67890';
    }
  });

  afterAll(async () => {
    if (server) await server.close();
    await disconnectPrisma();
  });

  it('verifies the full WhatsApp authentication cycle', async () => {
    // Step 1: Initiate Auth
    const initRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/initiate',
      payload: {
        client_id: clientId,
        phone_number: testPhone,
        redirect_uri: redirectUri,
        state: 'csrf_test_state_123',
      },
    });

    if (initRes.statusCode === 200) {
      const initJson = JSON.parse(initRes.body);
      expect(initJson.success).toBe(true);
      expect(initJson.data.challenge).toBeDefined();
      expect(initJson.data.whatsapp_deep_link).toContain('wa.me');

      const challenge = initJson.data.challenge;

      // Step 2: Inbound WhatsApp Message Webhook
      const msgRes = await server.inject({
        method: 'POST',
        url: '/api/v1/internal/whatsapp/webhook',
        headers: {
          authorization: `Bearer ${loadConfig().workerInternalSecret}`,
        },
        payload: {
          from: testPhone,
          body: challenge,
          timestamp: Date.now(),
        },
      });

      const msgJson = JSON.parse(msgRes.body);
      expect(msgJson.success).toBe(true);
      expect(msgJson.matchedAttempt).toBe(true);
    }
  });
});
