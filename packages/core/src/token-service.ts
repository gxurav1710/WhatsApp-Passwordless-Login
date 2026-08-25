import { generateSecureToken, generateAuthCode, sha256, safeEqual } from '@whatsapp-auth/security';

export interface GeneratedLoginToken {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface GeneratedAuthCode {
  rawCode: string;
  codeHash: string;
  expiresAt: Date;
}

export class TokenService {
  constructor(
    private readonly loginTokenTtlSeconds: number = 120, // 2 minutes
    private readonly authCodeTtlSeconds: number = 60 // 60 seconds
  ) {}

  /**
   * Generates a single-use login token (sent in WhatsApp reply message)
   */
  public createLoginToken(ttlSeconds?: number): GeneratedLoginToken {
    const ttl = ttlSeconds ?? this.loginTokenTtlSeconds;
    const rawToken = generateSecureToken(32);
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    return { rawToken, tokenHash, expiresAt };
  }

  /**
   * Verifies raw login token against stored hash in constant time
   */
  public verifyLoginToken(rawToken: string, storedHash: string): boolean {
    const computedHash = sha256(rawToken);
    return safeEqual(computedHash, storedHash);
  }

  /**
   * Generates a single-use authorization code (used in OAuth2 redirect callback)
   */
  public createAuthCode(ttlSeconds?: number): GeneratedAuthCode {
    const ttl = ttlSeconds ?? this.authCodeTtlSeconds;
    const rawCode = generateAuthCode();
    const codeHash = sha256(rawCode);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    return { rawCode, codeHash, expiresAt };
  }

  /**
   * Verifies raw auth code against stored hash in constant time
   */
  public verifyAuthCode(rawCode: string, storedHash: string): boolean {
    const computedHash = sha256(rawCode);
    return safeEqual(computedHash, storedHash);
  }

  /**
   * Builds the one-time continuation URL for the WhatsApp message.
   * Extracts ONLY the origin from the application's registered redirect URI.
   * Formula: new URL(redirectUri).origin + "/continue/" + rawToken
   */
  public buildContinuationUrl(redirectUriOrBaseUrl: string, rawToken: string): string {
    try {
      const url = new URL(redirectUriOrBaseUrl);
      return `${url.origin}/continue/${rawToken}`;
    } catch {
      const cleanBase = redirectUriOrBaseUrl.replace(/\/+$/, '');
      return `${cleanBase}/continue/${rawToken}`;
    }
  }

  /**
   * Builds the developer redirect callback URL with code and state
   */
  public buildCallbackUrl(redirectUri: string, authCode: string, state?: string | null): string {
    const url = new URL(redirectUri);
    url.searchParams.set('code', authCode);
    if (state) {
      url.searchParams.set('state', state);
    }
    return url.toString();
  }
}
