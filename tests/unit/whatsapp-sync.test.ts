import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../../apps/api/src/services/auth.service.js';
import { ChallengeService, TokenService } from '@whatsapp-auth/core';
import { ErrorCode, AppError, AppStatus } from '@whatsapp-auth/protocol';

describe('WhatsApp Number Dynamic Sync and Deep Link Generation', () => {
  let mockWorkerStatus: { status: string; phoneNumber: string | null };
  let mockDbSession: { status: string; phoneNumber: string | null } | null;
  let authService: AuthService;

  const mockConfig: any = {
    challengeTtlSeconds: 300,
    loginTokenTtlSeconds: 120,
    authCodeTtlSeconds: 60,
    challengePrefix: 'AUTH',
    whatsappBotPhone: '+14155550199', // Old placeholder config
  };

  const mockAppRepo: any = {
    findByClientId: async (clientId: string) => ({
      id: 'app_123',
      clientId,
      redirectUris: ['http://localhost:5000/auth/callback'],
      status: AppStatus.DEVELOPMENT,
    }),
  };

  const mockAttemptRepo: any = {
    create: async (data: any) => ({
      id: 'att_test_123',
      ...data,
    }),
  };

  const mockUserRepo: any = {};
  const mockSessionRepo: any = {};
  const mockAuditRepo: any = { log: async () => {} };
  const mockSseManager: any = { emitAuthUpdate: () => {} };

  const mockWorkerClient: any = {
    getStatus: async () => mockWorkerStatus,
  };

  const mockWaSessionRepo: any = {
    getSession: async () => mockDbSession,
  };

  beforeEach(() => {
    mockWorkerStatus = { status: 'DISCONNECTED', phoneNumber: null };
    mockDbSession = null;

    authService = new AuthService(
      mockConfig,
      mockAppRepo,
      mockAttemptRepo,
      mockUserRepo,
      mockSessionRepo,
      mockWaSessionRepo,
      mockAuditRepo,
      mockWorkerClient,
      mockSseManager
    );
  });

  it('fails with WHATSAPP_NOT_CONNECTED when worker is disconnected', async () => {
    mockWorkerStatus = { status: 'DISCONNECTED', phoneNumber: null };
    mockDbSession = null;

    await expect(
      authService.initiateAuth({
        client_id: 'wa_client_test',
        phone_number: '+14155552671',
        redirect_uri: 'http://localhost:5000/auth/callback',
      })
    ).rejects.toThrowError(
      expect.objectContaining({
        code: ErrorCode.WHATSAPP_NOT_CONNECTED,
        statusCode: 503,
      })
    );
  });

  it('fails with WHATSAPP_NOT_CONNECTED when worker is QR_READY / INITIALIZING', async () => {
    mockWorkerStatus = { status: 'QR_READY', phoneNumber: null };

    await expect(
      authService.initiateAuth({
        client_id: 'wa_client_test',
        phone_number: '+14155552671',
        redirect_uri: 'http://localhost:5000/auth/callback',
      })
    ).rejects.toThrowError(
      expect.objectContaining({
        code: ErrorCode.WHATSAPP_NOT_CONNECTED,
      })
    );
  });

  it('generates wa.me deep link using the actual connected WhatsApp number (+919876543210)', async () => {
    mockWorkerStatus = {
      status: 'CONNECTED',
      phoneNumber: '+919876543210',
    };

    const result = await authService.initiateAuth({
      client_id: 'wa_client_test',
      phone_number: '+14155552671',
      redirect_uri: 'http://localhost:5000/auth/callback',
    });

    expect(result.whatsapp_deep_link).toBeDefined();
    expect(result.whatsapp_deep_link).toContain('https://wa.me/919876543210?text=AUTH-');
    expect(result.whatsapp_deep_link).not.toContain('14155550199'); // Must NOT use placeholder
  });

  it('updates generated links when worker identity changes (+14155550001)', async () => {
    // New phone paired
    mockWorkerStatus = {
      status: 'CONNECTED',
      phoneNumber: '+14155550001',
    };

    const result = await authService.initiateAuth({
      client_id: 'wa_client_test',
      phone_number: '+14155552671',
      redirect_uri: 'http://localhost:5000/auth/callback',
    });

    expect(result.whatsapp_deep_link).toContain('https://wa.me/14155550001?text=AUTH-');
    expect(result.whatsapp_deep_link).not.toContain('919876543210');
  });

  it('falls back to database session identity if worker is warming up but session exists', async () => {
    mockWorkerStatus = { status: 'INITIALIZING', phoneNumber: null };
    mockDbSession = { status: 'CONNECTED', phoneNumber: '+918888877777' };

    const result = await authService.initiateAuth({
      client_id: 'wa_client_test',
      phone_number: '+14155552671',
      redirect_uri: 'http://localhost:5000/auth/callback',
    });

    expect(result.whatsapp_deep_link).toContain('https://wa.me/918888877777?text=AUTH-');
  });
});
