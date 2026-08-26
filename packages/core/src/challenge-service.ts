import { generateChallenge, sha256, safeEqual } from '@whatsapp-auth/security';

export interface GeneratedChallenge {
  challenge: string;
  challengeHash: string;
  challengePrefix: string;
  expiresAt: Date;
}

export class ChallengeService {
  constructor(
    private readonly defaultTtlSeconds: number = 300,
    private readonly defaultPrefix: string = 'AUTH'
  ) {}

  /**
   * Generates a new cryptographically random challenge with SHA-256 hash and expiry.
   */
  public createChallenge(prefix?: string, ttlSeconds?: number): GeneratedChallenge {
    const pfx = (prefix || this.defaultPrefix).toUpperCase().trim();
    const ttl = ttlSeconds ?? this.defaultTtlSeconds;
    const challenge = generateChallenge(pfx, 2, 4);
    const challengeHash = sha256(challenge);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    return {
      challenge,
      challengeHash,
      challengePrefix: pfx,
      expiresAt,
    };
  }

  /**
   * Extracts possible challenge strings from arbitrary message text using regex.
   * Handles both "PREFIX-XXXX-XXXX" and "XXXX-XXXX" formats cleanly.
   */
  public extractChallenge(messageBody: string, prefix: string = 'AUTH'): string | null {
    if (!messageBody || typeof messageBody !== 'string') return null;
    const cleanBody = messageBody.trim().toUpperCase();
    const pfx = (prefix || this.defaultPrefix).toUpperCase();

    // Match "PREFIX-XXXX-XXXX" or "XXXX-XXXX"
    const regex = new RegExp(`(?:${pfx}-)?([A-Z0-9]{4}-[A-Z0-9]{4})`, 'i');
    const match = cleanBody.match(regex);
    if (!match) return null;

    return `${pfx}-${match[1].toUpperCase()}`;
  }

  /**
   * Validates if a raw challenge matches the stored hash in constant time.
   */
  public verifyChallenge(rawChallenge: string, storedHash: string): boolean {
    const computedHash = sha256(rawChallenge.trim().toUpperCase());
    return safeEqual(computedHash, storedHash);
  }

  /**
   * Generates an official wa.me WhatsApp deep link with clean digits and URL-encoded challenge text.
   */
  public buildWhatsAppDeepLink(botPhoneNumber: string, challenge: string): string {
    const cleanNumber = botPhoneNumber.replace(/\D/g, '').trim();
    const encodedText = encodeURIComponent(challenge);
    return `https://wa.me/${cleanNumber}?text=${encodedText}`;
  }
}
