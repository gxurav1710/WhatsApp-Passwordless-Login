import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Computes a SHA-256 hash of the given plain string.
 * Output is lowercase hex string.
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Constant-time string equality comparison to prevent timing attacks.
 */
export function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      // Dummy comparison to prevent timing leak on length
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Hashes a client secret using SHA-256 (or HMAC with salt).
 */
export function hashClientSecret(secret: string, salt: string = 'wa_sec_salt'): string {
  return createHash('sha256').update(`${salt}:${secret}`, 'utf8').digest('hex');
}

/**
 * Verifies a client secret against a stored hash in constant time.
 */
export function verifyClientSecret(providedSecret: string, storedHash: string, salt: string = 'wa_sec_salt'): boolean {
  const computed = hashClientSecret(providedSecret, salt);
  return safeEqual(computed, storedHash);
}
