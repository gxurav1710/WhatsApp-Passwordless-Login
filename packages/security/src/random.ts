import { randomBytes } from 'node:crypto';

// Unambiguous character alphabet excluding confusing characters (0, O, 1, I, L)
const CHALLENGE_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates a cryptographically secure random alphanumeric challenge.
 * Default format: "AUTH-XXXX-XXXX" (e.g. "AUTH-7K92-MX81")
 */
export function generateChallenge(prefix: string = 'AUTH', segments: number = 2, segmentLength: number = 4): string {
  const parts: string[] = [];
  const totalChars = segments * segmentLength;
  const bytes = randomBytes(totalChars);

  let byteIndex = 0;
  for (let s = 0; s < segments; s++) {
    let segment = '';
    for (let i = 0; i < segmentLength; i++) {
      const randomIndex = bytes[byteIndex++] % CHALLENGE_CHARSET.length;
      segment += CHALLENGE_CHARSET[randomIndex];
    }
    parts.push(segment);
  }

  const cleanPrefix = prefix ? `${prefix.toUpperCase()}-` : '';
  return `${cleanPrefix}${parts.join('-')}`;
}

/**
 * Generates a cryptographically secure random token (hex or base64url).
 */
export function generateSecureToken(byteLength: number = 32): string {
  return randomBytes(byteLength).toString('base64url');
}

/**
 * Generates a unique OAuth 2.0 Client ID (e.g. "wa_client_8f9a2b...")
 */
export function generateClientId(): string {
  return `wa_client_${randomBytes(12).toString('hex')}`;
}

/**
 * Generates a secure OAuth 2.0 Client Secret (e.g. "wa_sec_99a8b7...")
 */
export function generateClientSecret(): string {
  return `wa_sec_${randomBytes(32).toString('base64url')}`;
}

/**
 * Generates an authorization code (60s TTL)
 */
export function generateAuthCode(): string {
  return `wa_code_${randomBytes(24).toString('base64url')}`;
}
