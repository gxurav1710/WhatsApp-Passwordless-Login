import { createHash } from 'node:crypto';
import { safeEqual } from './hash.js';

/**
 * Validates a PKCE code_verifier against a code_challenge.
 * Supports S256 (SHA-256 base64url) and plain.
 */
export function verifyPKCE(
  codeVerifier: string,
  codeChallenge: string,
  method: 'S256' | 'plain' = 'S256'
): boolean {
  if (!codeVerifier || !codeChallenge) {
    return false;
  }

  if (method === 'plain') {
    return safeEqual(codeVerifier, codeChallenge);
  }

  if (method === 'S256') {
    // S256: BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
    const hash = createHash('sha256').update(codeVerifier, 'ascii').digest('base64url');
    return safeEqual(hash, codeChallenge);
  }

  return false;
}
