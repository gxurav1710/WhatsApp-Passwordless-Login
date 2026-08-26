/**
 * Standalone WhatsApp Authentication Client
 * Zero external dependencies — Uses native fetch (Node 18+)
 */
export class WhatsAppAuthClient {
  /**
   * @param {Object} config
   * @param {string} config.baseUrl - WhatsApp Auth Server URL (e.g. http://localhost:4000 or Cloudflare Tunnel)
   * @param {string} [config.clientId] - OAuth 2.0 Client ID
   * @param {string} [config.clientSecret] - OAuth 2.0 Client Secret (optional for public clients)
   */
  constructor(config = {}) {
    if (!config.baseUrl) {
      throw new Error('WhatsAppAuthClient: baseUrl is required (e.g. http://localhost:4000)');
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.clientId = config.clientId || '';
    this.clientSecret = config.clientSecret;
  }

  async parseJsonResponse(response, endpoint) {
    const rawText = await response.text();
    let json;
    try {
      json = JSON.parse(rawText);
    } catch {
      throw new Error(
        `Auth Server at ${this.baseUrl} returned a non-JSON response (${response.status} ${response.statusText}). ` +
        `Please check that your WhatsApp Auth Server is running and that AUTH_API_URL (${this.baseUrl}) is publicly reachable.`
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
   * Step 1: Initiate authentication for user with Full Name, Email, and Mobile Number.
   * Returns deep link to open WhatsApp with pre-filled challenge.
   *
   * @param {Object} params
   * @param {string} params.phoneNumber - User's mobile number (+91...)
   * @param {string} [params.fullName] - User's full display name
   * @param {string} [params.email] - User's email address
   * @param {string} params.redirectUri - Whitelisted OAuth callback URL
   * @param {string} [params.state] - CSRF protection state string
   * @param {string} [params.codeChallenge] - PKCE code challenge (optional)
   * @param {string} [params.codeChallengeMethod] - 'S256' or 'plain' (optional)
   */
  async initiate(params) {
    if (!this.clientId) {
      throw new Error(
        'WhatsAppAuthClient: AUTH_CLIENT_ID is not configured. Please create an application in your WhatsApp Auth Dashboard (http://localhost:3000) and set AUTH_CLIENT_ID in your .env file.'
      );
    }

    const url = `${this.baseUrl}/api/v1/auth/initiate`;
    let response;
    try {
      response = await fetch(url, {
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
    } catch (networkErr) {
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
   * Step 2: Exchange single-use authorization code for verified user identity.
   *
   * @param {Object} params
   * @param {string} params.code - Authorization code from callback query string
   * @param {string} params.redirectUri - Matching redirect URI
   * @param {string} [params.codeVerifier] - PKCE verifier if PKCE was used
   */
  async exchangeCode(params) {
    if (!this.clientId) {
      throw new Error(
        'WhatsAppAuthClient: AUTH_CLIENT_ID is not configured. Please create an application in your WhatsApp Auth Dashboard (http://localhost:3000) and set AUTH_CLIENT_ID in your .env file.'
      );
    }

    const url = `${this.baseUrl}/api/v1/auth/token`;
    let response;
    try {
      response = await fetch(url, {
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
    } catch (networkErr) {
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
   * Step 3: Verify or introspect an active session token.
   *
   * @param {string} token - Session access token
   */
  async verifySession(token) {
    const url = `${this.baseUrl}/api/v1/auth/verify-session`;
    try {
      const response = await fetch(url, {
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
