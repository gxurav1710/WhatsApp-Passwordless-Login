import { describe, it, expect } from 'vitest';
import {
  sha256,
  safeEqual,
  hashClientSecret,
  verifyClientSecret,
  generateChallenge,
  generateSecureToken,
  generateClientId,
  generateClientSecret,
  generateAuthCode,
  normalizePhoneNumber,
  arePhoneNumbersEqual,
  verifyPKCE,
  SlidingWindowRateLimiter,
} from '@whatsapp-auth/security';

describe('Security Utilities', () => {
  describe('SHA-256 & Constant Time Comparisons', () => {
    it('computes accurate sha256 hex strings', () => {
      const hash1 = sha256('hello-world');
      const hash2 = sha256('hello-world');
      const hash3 = sha256('different');
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toHaveLength(64);
    });

    it('verifies strings in constant time', () => {
      expect(safeEqual('abc', 'abc')).toBe(true);
      expect(safeEqual('abc', 'def')).toBe(false);
      expect(safeEqual('short', 'much-longer-string')).toBe(false);
    });

    it('hashes and verifies client secrets', () => {
      const secret = generateClientSecret();
      const hash = hashClientSecret(secret);
      expect(verifyClientSecret(secret, hash)).toBe(true);
      expect(verifyClientSecret('wrong_secret', hash)).toBe(false);
    });
  });

  describe('Random Challenge & Token Generation', () => {
    it('generates challenges matching format AUTH-XXXX-XXXX', () => {
      const challenge = generateChallenge('AUTH', 2, 4);
      expect(challenge).toMatch(/^AUTH-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    });

    it('generates random secure tokens and auth codes', () => {
      const token1 = generateSecureToken(32);
      const token2 = generateSecureToken(32);
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThanOrEqual(32);

      const clientId = generateClientId();
      expect(clientId).toMatch(/^wa_client_[a-f0-9]{24}$/);

      const authCode = generateAuthCode();
      expect(authCode).toMatch(/^wa_code_/);
    });
  });

  describe('E.164 Phone Normalization', () => {
    it('normalizes standard international numbers', () => {
      expect(normalizePhoneNumber('+1 (415) 555-2671')).toBe('+14155552671');
      expect(normalizePhoneNumber('0044 7911 123456')).toBe('+447911123456');
      expect(normalizePhoneNumber('919876543210')).toBe('+919876543210');
    });

    it('strips WhatsApp JID suffixes', () => {
      expect(normalizePhoneNumber('14155552671@c.us')).toBe('+14155552671');
      expect(normalizePhoneNumber('919876543210@s.whatsapp.net')).toBe('+919876543210');
    });

    it('compares phone numbers accurately', () => {
      expect(arePhoneNumbersEqual('+1 415-555-2671', '14155552671@c.us')).toBe(true);
      expect(arePhoneNumbersEqual('+14155552671', '+14155559999')).toBe(false);
    });

    it('throws error for invalid phone numbers', () => {
      expect(() => normalizePhoneNumber('invalid-phone')).toThrow();
      expect(() => normalizePhoneNumber('123')).toThrow();
    });
  });

  describe('PKCE S256 Verification', () => {
    it('validates plain verifiers', () => {
      expect(verifyPKCE('my-code-verifier', 'my-code-verifier', 'plain')).toBe(true);
      expect(verifyPKCE('my-code-verifier', 'wrong', 'plain')).toBe(false);
    });

    it('validates S256 verifiers', () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
      expect(verifyPKCE(verifier, challenge, 'S256')).toBe(true);
      expect(verifyPKCE('invalid-verifier', challenge, 'S256')).toBe(false);
    });
  });

  describe('Sliding Window Rate Limiter', () => {
    it('limits requests within time window', () => {
      const limiter = new SlidingWindowRateLimiter(1000, 3);
      expect(limiter.check('ip:1.2.3.4').allowed).toBe(true);
      expect(limiter.check('ip:1.2.3.4').allowed).toBe(true);
      expect(limiter.check('ip:1.2.3.4').allowed).toBe(true);
      // 4th request rejected
      expect(limiter.check('ip:1.2.3.4').allowed).toBe(false);
      // Different IP allowed
      expect(limiter.check('ip:5.6.7.8').allowed).toBe(true);
      limiter.destroy();
    });
  });
});
