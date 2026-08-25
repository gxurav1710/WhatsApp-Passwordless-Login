import { describe, it, expect } from 'vitest';
import { InitiateAuthRequestSchema, TokenExchangeResponse } from '@whatsapp-auth/protocol';
import { normalizePhoneNumber } from '@whatsapp-auth/security';

describe('Profile Identity & 3-Field Initiation Unit Tests', () => {
  it('validates a complete initiation request with full name, email, and mobile number', () => {
    const rawInput = {
      client_id: 'wa_client_12345',
      full_name: 'Gaurav Mehra',
      email: 'gaurav@example.com',
      phone_number: '+919876543210',
      redirect_uri: 'http://localhost:5000/auth/callback',
      state: 'state_123',
    };

    const parsed = InitiateAuthRequestSchema.safeParse(rawInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.full_name).toBe('Gaurav Mehra');
      expect(parsed.data.email).toBe('gaurav@example.com');
      expect(parsed.data.phone_number).toBe('+919876543210');
    }
  });

  it('normalizes email casing and trims full name whitespace', () => {
    const rawInput = {
      client_id: 'wa_client_12345',
      full_name: '  Gaurav Mehra  ',
      email: '  gaurav@example.com  ',
      phone_number: '+919876543210',
      redirect_uri: 'http://localhost:5000/auth/callback',
    };

    const parsed = InitiateAuthRequestSchema.safeParse(rawInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.full_name).toBe('Gaurav Mehra');
      expect(parsed.data.email).toBe('gaurav@example.com');
    }
  });

  it('rejects invalid email addresses at schema boundary', () => {
    const invalidEmailInput = {
      client_id: 'wa_client_12345',
      full_name: 'Gaurav Mehra',
      email: 'not-an-email',
      phone_number: '+919876543210',
      redirect_uri: 'http://localhost:5000/auth/callback',
    };

    const parsed = InitiateAuthRequestSchema.safeParse(invalidEmailInput);
    expect(parsed.success).toBe(false);
  });

  it('preserves phone number as the identity anchor across normalization', () => {
    const phone1 = '+91 98765 43210';
    const phone2 = '919876543210';
    const phone3 = '+919876543210';

    expect(normalizePhoneNumber(phone1)).toBe('+919876543210');
    expect(normalizePhoneNumber(phone2)).toBe('+919876543210');
    expect(normalizePhoneNumber(phone3)).toBe('+919876543210');
  });

  it('allows optional full_name and email for backward compatibility', () => {
    const minimalInput = {
      client_id: 'wa_client_12345',
      phone_number: '+919876543210',
      redirect_uri: 'http://localhost:5000/auth/callback',
    };

    const parsed = InitiateAuthRequestSchema.safeParse(minimalInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.full_name).toBeUndefined();
      expect(parsed.data.email).toBeUndefined();
      expect(parsed.data.phone_number).toBe('+919876543210');
    }
  });
});
