import { describe, it, expect } from 'vitest';
import { ChallengeService, TokenService, validateRedirectUri } from '@whatsapp-auth/core';

describe('Challenge and Token Services', () => {
  const challengeService = new ChallengeService(300, 'AUTH');
  const tokenService = new TokenService(120, 60);

  describe('ChallengeService', () => {
    it('creates challenge with hash and expiry', () => {
      const res = challengeService.createChallenge('AUTH', 300);
      expect(res.challenge).toMatch(/^AUTH-/);
      expect(res.challengeHash).toHaveLength(64);
      expect(res.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('extracts challenge from formatted incoming message body', () => {
      expect(challengeService.extractChallenge('AUTH-7K92-MX81')).toBe('AUTH-7K92-MX81');
      expect(challengeService.extractChallenge('Please verify: AUTH-7K92-MX81 thank you')).toBe('AUTH-7K92-MX81');
      expect(challengeService.extractChallenge('auth-7k92-mx81')).toBe('AUTH-7K92-MX81');
      expect(challengeService.extractChallenge('random text without code')).toBeNull();
    });

    it('verifies challenge matches hash in constant time', () => {
      const { challenge, challengeHash } = challengeService.createChallenge();
      expect(challengeService.verifyChallenge(challenge, challengeHash)).toBe(true);
      expect(challengeService.verifyChallenge('AUTH-WRONG-CODE', challengeHash)).toBe(false);
    });

    it('builds wa.me deep link with pre-filled challenge text and encodes special characters', () => {
      const link = challengeService.buildWhatsAppDeepLink('+14155550199', 'AUTH-7K92-MX81');
      expect(link).toBe('https://wa.me/14155550199?text=AUTH-7K92-MX81');

      const formattedPhoneLink = challengeService.buildWhatsAppDeepLink('+1 (415) 555-0199', 'AUTH-7K92-MX81');
      expect(formattedPhoneLink).toBe('https://wa.me/14155550199?text=AUTH-7K92-MX81');

      const customLink = challengeService.buildWhatsAppDeepLink('+14155550199', 'AUTH-1234 & TEST');
      expect(customLink).toBe('https://wa.me/14155550199?text=AUTH-1234%20%26%20TEST');
    });
  });

  describe('TokenService', () => {
    it('creates and verifies login tokens', () => {
      const { rawToken, tokenHash, expiresAt } = tokenService.createLoginToken(120);
      expect(rawToken.length).toBeGreaterThan(20);
      expect(tokenService.verifyLoginToken(rawToken, tokenHash)).toBe(true);
      expect(tokenService.verifyLoginToken('invalid-token', tokenHash)).toBe(false);
    });

    it('creates authorization codes and builds callback url', () => {
      const { rawCode, codeHash } = tokenService.createAuthCode(60);
      expect(tokenService.verifyAuthCode(rawCode, codeHash)).toBe(true);

      const callbackUrl = tokenService.buildCallbackUrl(
        'https://myapp.com/auth/callback',
        rawCode,
        'state_xyz'
      );
      expect(callbackUrl).toBe(`https://myapp.com/auth/callback?code=${rawCode}&state=state_xyz`);
    });

    it('builds dynamic continuation URL extracting ONLY the origin from the registered redirect URI', () => {
      const token = 'TOKEN_TEST_XYZ123';

      // Example Application A
      const urlA = tokenService.buildContinuationUrl('https://website-a.com/auth/callback', token);
      expect(urlA).toBe('https://website-a.com/continue/TOKEN_TEST_XYZ123');

      // Example Application B with nested OAuth path
      const urlB = tokenService.buildContinuationUrl('https://website-b.com/login/oauth/callback', token);
      expect(urlB).toBe('https://website-b.com/continue/TOKEN_TEST_XYZ123');

      // Localhost with port
      const urlLocal = tokenService.buildContinuationUrl('http://localhost:5000/auth/callback', token);
      expect(urlLocal).toBe('http://localhost:5000/continue/TOKEN_TEST_XYZ123');

      // Port 3000
      const urlPort = tokenService.buildContinuationUrl('http://localhost:3000/api/auth/callback', token);
      expect(urlPort).toBe('http://localhost:3000/continue/TOKEN_TEST_XYZ123');
    });
  });

  describe('Redirect URI Validation', () => {
    const allowed = ['http://localhost:5000/auth/callback', 'https://myapp.com/auth/callback'];

    it('accepts exact matching URIs', () => {
      expect(validateRedirectUri('http://localhost:5000/auth/callback', allowed)).toBe(true);
      expect(validateRedirectUri('https://myapp.com/auth/callback', allowed)).toBe(true);
    });

    it('rejects unallowed redirects or subpaths', () => {
      expect(validateRedirectUri('https://evil.com/callback', allowed)).toBe(false);
      expect(validateRedirectUri('https://myapp.com/auth/callback/extra', allowed)).toBe(false);
      expect(validateRedirectUri('javascript:alert(1)', allowed)).toBe(false);
    });
  });
});
