import {
  WhatsAppAuthConfig,
  InitiateLoginParams,
  InitiateLoginResult,
  ExchangeCodeParams,
  TokenExchangeResult,
  AuthenticatedUser,
} from './types.js';

export class WhatsAppAuthClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret?: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(config: WhatsAppAuthConfig) {
    if (!config.baseUrl) throw new Error('WhatsAppAuthClient: baseUrl is required');
    if (!config.clientId) throw new Error('WhatsAppAuthClient: clientId is required');

    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.fetchImpl = config.fetch || globalThis.fetch;
  }

  private async parseJsonResponse(response: Response, endpoint: string): Promise<any> {
    const rawText = await response.text();
    let json: any;
    try {
      json = JSON.parse(rawText);
    } catch {
      throw new Error(
        `Auth Server (${this.baseUrl}) returned non-JSON response (${response.status} ${response.statusText}). ` +
        `Please check that your WhatsApp Auth Server is running and reachable at ${this.baseUrl}.`
      );
    }

    if (!response.ok || !json.success) {
      const errorMsg =
        json?.error?.message ||
        (typeof json?.error === 'string'
          ? json.error
          : `Request to ${endpoint} failed with status ${response.status}`);
      throw new Error(errorMsg);
    }

    return json;
  }

  /**
   * Step 1: Initiate authentication for a user phone number with optional profile details.
   * Returns deep link to open WhatsApp with pre-filled challenge.
   */
  async initiate(params: InitiateLoginParams): Promise<InitiateLoginResult> {
    const url = `${this.baseUrl}/api/v1/auth/initiate`;
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          phone_number: params.phoneNumber,
          full_name: params.fullName,
          email: params.email,
          redirect_uri: params.redirectUri,
          state: params.state,
          code_challenge: params.codeChallenge,
          code_challenge_method: params.codeChallengeMethod || 'S256',
        }),
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to reach Auth Server at ${this.baseUrl}: ${networkErr.message}`);
    }

    const json = await this.parseJsonResponse(response, '/api/v1/auth/initiate');

    return {
      attemptId: json.data.attempt_id,
      challenge: json.data.challenge,
      whatsappDeepLink: json.data.whatsapp_deep_link,
      expiresIn: json.data.expires_in,
      expiresAt: json.data.expires_at,
      sseUrl: `${this.baseUrl}${json.data.sse_url}`,
    };
  }

  /**
   * Step 2: Exchange authorization code for authenticated user details.
   */
  async exchangeCode(params: ExchangeCodeParams): Promise<TokenExchangeResult> {
    const url = `${this.baseUrl}/api/v1/auth/token`;
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: params.code,
          redirect_uri: params.redirectUri,
          code_verifier: params.codeVerifier,
        }),
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to reach Auth Server at ${this.baseUrl}: ${networkErr.message}`);
    }

    const json = await this.parseJsonResponse(response, '/api/v1/auth/token');

    return {
      accessToken: json.data.access_token,
      tokenType: json.data.token_type,
      expiresIn: json.data.expires_in,
      user: {
        id: json.data.user.id,
        fullName: json.data.user.full_name || null,
        email: json.data.user.email || null,
        phoneNumber: json.data.user.phone_number,
        verifiedAt: json.data.user.verified_at,
        status: json.data.user.status || 'ACTIVE',
      },
    };
  }

  /**
   * Introspect / verify an existing session token.
   */
  async verifySession(token: string): Promise<{ active: boolean; user?: AuthenticatedUser }> {
    const url = `${this.baseUrl}/api/v1/auth/verify-session`;
    try {
      const response = await this.fetchImpl(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const rawText = await response.text();
      const json = JSON.parse(rawText);
      if (!response.ok || !json.success) {
        return { active: false };
      }

      return {
        active: json.data.active,
        user: json.data.user
          ? {
              id: json.data.user.id,
              fullName: json.data.user.full_name || null,
              email: json.data.user.email || null,
              phoneNumber: json.data.user.phone_number,
              verifiedAt: json.data.user.verified_at || new Date().toISOString(),
              status: json.data.user.status || 'ACTIVE',
            }
          : undefined,
      };
    } catch {
      return { active: false };
    }
  }
}
