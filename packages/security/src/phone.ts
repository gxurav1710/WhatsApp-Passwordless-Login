import { AppError, ErrorCode } from '@whatsapp-auth/protocol';

/**
 * Normalizes an incoming raw phone number string into standard E.164 format (e.g. +14155552671)
 * Strips all spaces, dashes, parentheses, dots, and WhatsApp-specific suffixes (@c.us, @s.whatsapp.net).
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new AppError(ErrorCode.INVALID_PHONE, 'Phone number must be a non-empty string');
  }

  // Strip WhatsApp JID suffixes if present (e.g. "14155552671@c.us")
  let cleaned = rawPhone.split('@')[0].trim();

  // Remove any spaces, dashes, dots, brackets
  cleaned = cleaned.replace(/[\s\-\(\)\.]/g, '');

  // If starts with 00 (international prefix), convert to +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  // Ensure it has a leading '+'
  if (!cleaned.startsWith('+')) {
    // If it is just digits, prepend '+'
    if (/^\d{7,15}$/.test(cleaned)) {
      cleaned = '+' + cleaned;
    } else {
      throw new AppError(
        ErrorCode.INVALID_PHONE,
        `Invalid phone number format: "${rawPhone}". Expected E.164 format with country code (e.g. +14155552671)`
      );
    }
  }

  // Validate E.164: + followed by 7 to 15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    throw new AppError(
      ErrorCode.INVALID_PHONE,
      `Phone number "${rawPhone}" does not match valid E.164 specification (+[country_code][subscriber_number], 7-15 digits)`
    );
  }

  return cleaned;
}

/**
 * Compares two phone numbers for equality under E.164 normalization.
 */
export function arePhoneNumbersEqual(phoneA: string, phoneB: string): boolean {
  try {
    const normA = normalizePhoneNumber(phoneA);
    const normB = normalizePhoneNumber(phoneB);
    return normA === normB;
  } catch {
    return false;
  }
}
