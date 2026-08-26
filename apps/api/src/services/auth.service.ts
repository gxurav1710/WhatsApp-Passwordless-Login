import {
  InitiateAuthRequest,
  InitiateAuthResponse,
  TokenExchangeRequest,
  TokenExchangeResponse,
  VerifySessionResponse,
  AttemptState,
  AppStatus,
  AppError,
  ErrorCode,
} from '@whatsapp-auth/protocol';
import {
  normalizePhoneNumber,
  sha256,
  verifyPKCE,
  verifyClientSecret,
} from '@whatsapp-auth/security';
import {
  assertValidTransition,
  assertValidRedirectUri,
  ChallengeService,
  TokenService,
} from '@whatsapp-auth/core';
import {
  AppRepository,
  AuthAttemptRepository,
  UserRepository,
  SessionRepository,
  WhatsAppSessionRepository,
  AuditLogRepository,
} from '@whatsapp-auth/db';
import { WorkerClientService } from './worker-client.service.js';
import { SSEManager } from '../sse/sse-manager.js';
import { AppConfig } from '../config.js';

export class AuthService {
  private challengeService: ChallengeService;
  private tokenService: TokenService;

  constructor(
    private readonly config: AppConfig,
    private readonly appRepo: AppRepository,
    private readonly attemptRepo: AuthAttemptRepository,
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly waSessionRepo: WhatsAppSessionRepository,
    private readonly auditRepo: AuditLogRepository,
    private readonly workerClient: WorkerClientService,
    private readonly sseManager: SSEManager
  ) {
    this.challengeService = new ChallengeService(
      config.challengeTtlSeconds,
      config.challengePrefix
    );
    this.tokenService = new TokenService(
      config.loginTokenTtlSeconds,
      config.authCodeTtlSeconds
    );
  }

  /**
   * 1. Initiate Authentication Attempt
   */
  async initiateAuth(
    input: InitiateAuthRequest,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<InitiateAuthResponse['data']> {
    // 0. Verify WhatsApp connection and retrieve live connected phone number
    const workerStatus = await this.workerClient.getStatus().catch(() => null);
    const dbSession = await this.waSessionRepo.getSession('default').catch(() => null);

    const isConnected =
      (workerStatus?.status === 'CONNECTED' && workerStatus?.phoneNumber) ||
      (workerStatus?.status === 'AUTHENTICATED' && workerStatus?.phoneNumber) ||
      (dbSession?.status === 'CONNECTED' && dbSession?.phoneNumber);

    const botPhone = workerStatus?.phoneNumber || dbSession?.phoneNumber;

    if (!isConnected || !botPhone) {
      throw new AppError(
        ErrorCode.WHATSAPP_NOT_CONNECTED,
        'WhatsApp authentication account is not connected. Connect WhatsApp from the dashboard first.',
        503
      );
    }

    const normalizedBotPhone = normalizePhoneNumber(botPhone);

    // 1. Find Application & validate
    const app = await this.appRepo.findByClientId(input.client_id);
    if (!app) {
      throw new AppError(ErrorCode.APPLICATION_NOT_FOUND, 'Invalid client_id: application not found', 404);
    }
    if (app.status === AppStatus.DISABLED) {
      throw new AppError(ErrorCode.APPLICATION_DISABLED, 'Application is currently disabled', 403);
    }

    // 2. Validate Redirect URI
    assertValidRedirectUri(input.redirect_uri, app.redirectUris);

    // 3. Normalize Phone Number
    const normalizedPhone = normalizePhoneNumber(input.phone_number);

    // 4. Generate Challenge
    const { challenge, challengeHash, challengePrefix, expiresAt } =
      this.challengeService.createChallenge(this.config.challengePrefix, this.config.challengeTtlSeconds);

    // 5. Create Auth Attempt in Database with Full Name & Email
    const attempt = await this.attemptRepo.create({
      applicationId: app.id,
      phoneNumber: normalizedPhone,
      fullName: input.full_name?.trim() || null,
      email: input.email?.toLowerCase().trim() || null,
      challengeHash,
      challengePrefix,
      redirectUri: input.redirect_uri,
      stateParam: input.state,
      codeChallenge: input.code_challenge,
      codeChallengeMethod: input.code_challenge_method || 'S256',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      expiresAt,
    });

    // 6. Build wa.me Deep Link targeting the ACTUAL connected WhatsApp account
    const whatsappDeepLink = this.challengeService.buildWhatsAppDeepLink(
      normalizedBotPhone,
      challenge
    );

    // 7. Audit Log
    await this.auditRepo.log({
      eventType: 'AUTH_INITIATED',
      applicationId: app.id,
      ipAddress: meta?.ipAddress,
      details: {
        attemptId: attempt.id,
        phoneNumber: normalizedPhone,
        redirectUri: input.redirect_uri,
        botPhoneNumber: normalizedBotPhone,
      },
    });

    return {
      attempt_id: attempt.id,
      challenge,
      whatsapp_deep_link: whatsappDeepLink,
      expires_in: this.config.challengeTtlSeconds,
      expires_at: expiresAt.toISOString(),
      sse_url: `/api/v1/auth/events/${attempt.id}`,
    };
  }

  /**
   * 2. Handle Incoming WhatsApp Message from Worker Webhook
   */
  async handleIncomingWhatsAppMessage(msg: { from: string; body: string }): Promise<boolean> {
    const normalizedSender = normalizePhoneNumber(msg.from);
    console.log(`[AUTH SERVICE] 📨 Received incoming WhatsApp message webhook from ${normalizedSender}: "${msg.body}"`);

    const extractedChallenge = this.challengeService.extractChallenge(
      msg.body,
      this.config.challengePrefix
    );

    if (!extractedChallenge) {
      console.log(`[AUTH SERVICE] ℹ️ Message does not match challenge format (${this.config.challengePrefix}-XXXX-XXXX). Ignoring.`);
      return false;
    }

    const challengeHash = sha256(extractedChallenge);
    console.log(`[AUTH SERVICE] 🔍 Extracted challenge: "${extractedChallenge}"`);

    // Find matching active attempt
    const attempt = await this.attemptRepo.findActiveByPhoneAndChallenge(
      normalizedSender,
      challengeHash
    );

    if (!attempt) {
      console.warn(`[AUTH SERVICE] ⚠️ No active attempt found for challenge "${extractedChallenge}" from ${normalizedSender}.`);
      return false;
    }

    console.log(`[AUTH SERVICE] 🎯 Matched active auth attempt ${attempt.id} for user ${attempt.phoneNumber}`);

    // Mark attempt as VERIFIED
    await this.attemptRepo.updateState(attempt.id, AttemptState.VERIFIED, {
      verifiedAt: new Date(),
    });

    // Generate single-use login token and magic link
    const { rawToken, tokenHash, expiresAt } = this.tokenService.createLoginToken();
    await this.attemptRepo.createLoginToken(attempt.id, tokenHash, expiresAt);

    // Resolve dynamic continuation URL from the application's configured Auth Server URL (or fallback to global appUrl)
    const authServerUrl = (attempt as any).application?.authServerUrl || this.config.appUrl;
    const magicLoginLink = this.tokenService.buildContinuationUrl(authServerUrl, rawToken);
    console.log(`[AUTH SERVICE] 🔗 Generated Auth Server continuation link for ${(attempt as any).application?.name || 'app'}: ${magicLoginLink}`);

    // Audit log
    await this.auditRepo.log({
      eventType: 'CHALLENGE_VERIFIED',
      applicationId: attempt.applicationId,
      details: { attemptId: attempt.id, phone: normalizedSender },
    });

    // Send magic login link back to user via WhatsApp
    const message =
      `🔐 *WhatsApp Authentication*\n\n` +
      `Your verification code has been confirmed.\n\n` +
      `Click this secure link to complete login:\n` +
      `${magicLoginLink}\n\n` +
      `_This link will expire in ${Math.round(this.config.loginTokenTtlSeconds / 60)} minutes and can only be used once._`;

    console.log(`[AUTH SERVICE] 📤 Sending reverse magic login link to ${normalizedSender}...`);
    await this.workerClient.sendMessage(normalizedSender, message);

    // Emit live SSE update to waiting browser
    this.sseManager.emitAttemptUpdate(attempt.id, AttemptState.VERIFIED);

    return true;
  }

  /**
   * 3. Handle User Clicking Login Link (/continue/:token)
   */
  async handleContinueToken(rawToken: string): Promise<{ redirectUrl: string; attemptId: string }> {
    const tokenHash = sha256(rawToken);
    const loginTokenRecord = await this.attemptRepo.findLoginToken(tokenHash);

    if (!loginTokenRecord || !loginTokenRecord.authAttempt) {
      throw new AppError(ErrorCode.LOGIN_TOKEN_NOT_FOUND, 'Invalid or expired login token', 400);
    }

    const attempt = loginTokenRecord.authAttempt;

    // Verify token expiration & consumption
    const isExpired = loginTokenRecord.expiresAt < new Date();
    const isConsumed = !!loginTokenRecord.consumedAt;

    if (isExpired || isConsumed) {
      throw new AppError(ErrorCode.LOGIN_TOKEN_EXPIRED, 'Login link has expired or was already used.', 400);
    }

    // State transition guard
    assertValidTransition(attempt.state as AttemptState, AttemptState.COMPLETED, attempt.id);

    // Consume the login token
    await this.attemptRepo.consumeLoginToken(loginTokenRecord.id);

    // Create or update verified User with submitted profile attributes (fullName, email)
    const user = await this.userRepo.upsertByPhone(attempt.phoneNumber, {
      fullName: attempt.fullName,
      email: attempt.email,
    });

    // Generate single-use authorization code
    const { rawCode, codeHash, expiresAt } = this.tokenService.createAuthCode();
    await this.attemptRepo.createAuthorizationCode({
      authAttemptId: attempt.id,
      applicationId: attempt.applicationId,
      userId: user.id,
      codeHash,
      redirectUri: attempt.redirectUri,
      expiresAt,
    });

    // Mark attempt COMPLETED
    await this.attemptRepo.updateState(attempt.id, AttemptState.COMPLETED, {
      userId: user.id,
    });

    // Audit log
    await this.auditRepo.log({
      eventType: 'AUTH_COMPLETED',
      applicationId: attempt.applicationId,
      details: { attemptId: attempt.id, phoneNumber: attempt.phoneNumber, userId: user.id },
    });

    // Notify waiting browser via SSE
    this.sseManager.emitAttemptUpdate(attempt.id, AttemptState.COMPLETED);

    // Build developer callback redirect URL with auth code & state
    const redirectUrl = this.tokenService.buildCallbackUrl(
      attempt.redirectUri,
      rawCode,
      attempt.stateParam || undefined
    );

    return { redirectUrl, attemptId: attempt.id };
  }

  /**
   * 4. OAuth 2.0 Token Exchange (Authorization Code Grant)
   */
  async exchangeCode(
    input: TokenExchangeRequest,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<TokenExchangeResponse['data']> {
    // Validate Application
    const app = await this.appRepo.findByClientId(input.client_id);
    if (!app) {
      throw new AppError(ErrorCode.INVALID_CLIENT, 'Invalid client_id', 401);
    }

    // Validate Client Secret if configured (Confidential client)
    if (app.clientSecretHash) {
      if (!input.client_secret || !verifyClientSecret(input.client_secret, app.clientSecretHash)) {
        throw new AppError(ErrorCode.INVALID_CLIENT_SECRET, 'Invalid client_secret', 401);
      }
    }

    // Verify Authorization Code
    const codeHash = sha256(input.code);
    const authCodeRecord = await this.attemptRepo.findAuthorizationCode(codeHash);

    if (!authCodeRecord || !authCodeRecord.authAttempt) {
      throw new AppError(ErrorCode.AUTHORIZATION_CODE_NOT_FOUND, 'Invalid authorization code', 400);
    }

    if (authCodeRecord.applicationId !== app.id) {
      throw new AppError(ErrorCode.INVALID_CLIENT, 'Authorization code was not issued to this client', 400);
    }

    if (authCodeRecord.redirectUri !== input.redirect_uri) {
      throw new AppError(ErrorCode.INVALID_REDIRECT_URI, 'redirect_uri does not match original request', 400);
    }

    if (authCodeRecord.expiresAt < new Date() || authCodeRecord.consumedAt) {
      throw new AppError(ErrorCode.AUTHORIZATION_CODE_EXPIRED, 'Authorization code expired or already consumed', 400);
    }

    // PKCE Verification if code_challenge was provided
    if (authCodeRecord.authAttempt.codeChallenge) {
      if (!input.code_verifier) {
        throw new AppError(ErrorCode.INVALID_PKCE_VERIFIER, 'code_verifier is required for PKCE-protected attempts', 400);
      }
      const pkceValid = verifyPKCE(
        input.code_verifier,
        authCodeRecord.authAttempt.codeChallenge,
        (authCodeRecord.authAttempt.codeChallengeMethod as 'S256' | 'plain') || 'S256'
      );
      if (!pkceValid) {
        throw new AppError(ErrorCode.INVALID_PKCE_VERIFIER, 'PKCE verification failed: invalid code_verifier', 400);
      }
    }

    // Invalidate authorization code (Single-use)
    await this.attemptRepo.consumeAuthorizationCode(authCodeRecord.id);

    // Retrieve verified User
    const user = await this.userRepo.findById(authCodeRecord.userId);
    if (!user) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'User record not found for attempt', 500);
    }

    // Create session in database
    const { session, rawToken } = await this.sessionRepo.createSession({
      applicationId: app.id,
      userId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    // Audit log
    await this.auditRepo.log({
      eventType: 'TOKEN_EXCHANGED',
      applicationId: app.id,
      ipAddress: meta?.ipAddress,
      details: { attemptId: authCodeRecord.authAttemptId, userId: user.id },
    });

    return {
      access_token: rawToken,
      token_type: 'Bearer',
      expires_in: 30 * 24 * 60 * 60,
      user: {
        id: user.id,
        full_name: user.fullName || null,
        email: user.email || null,
        phone_number: user.phoneNumber,
        verified_at: user.updatedAt.toISOString(),
        status: (user as any).status || 'ACTIVE',
      },
    };
  }

  /**
   * 5. Session Verification & Introspection
   */
  async verifySession(token: string): Promise<VerifySessionResponse['data']> {
    const session = await this.sessionRepo.findByRawToken(token);

    if (!session || !session.user || (session.expiresAt && session.expiresAt < new Date()) || session.revokedAt) {
      return { active: false };
    }

    return {
      active: true,
      user: {
        id: session.user.id,
        full_name: session.user.fullName || null,
        email: session.user.email || null,
        phone_number: session.user.phoneNumber,
        status: (session.user as any).status || 'ACTIVE',
      },
      application_id: session.applicationId,
      expires_at: session.expiresAt.toISOString(),
    };
  }
}
