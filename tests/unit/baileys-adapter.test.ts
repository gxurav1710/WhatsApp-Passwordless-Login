import { describe, it, expect } from 'vitest';
import {
  normalizeJidToE164,
  e164ToBaileysJid,
  extractMessageText,
} from '../../apps/whatsapp-worker/src/adapters/baileys-adapter.js';

describe('BaileysAdapter JID Normalization & Message Extraction', () => {
  describe('normalizeJidToE164', () => {
    it('normalizes standard WhatsApp Multi-Device JID with country code', () => {
      const result = normalizeJidToE164('919876543210:12@s.whatsapp.net');
      expect(result).toBe('+919876543210');
    });

    it('normalizes standard @s.whatsapp.net JID without device suffix', () => {
      const result = normalizeJidToE164('919876543210@s.whatsapp.net');
      expect(result).toBe('+919876543210');
    });

    it('normalizes legacy @c.us JID', () => {
      const result = normalizeJidToE164('14155550199:0@c.us');
      expect(result).toBe('+14155550199');
    });

    it('handles US number format correctly', () => {
      const result = normalizeJidToE164('12025550108@s.whatsapp.net');
      expect(result).toBe('+12025550108');
    });

    it('returns null for empty or invalid JIDs', () => {
      expect(normalizeJidToE164('')).toBeNull();
      expect(normalizeJidToE164('invalid')).toBeNull();
      expect(normalizeJidToE164('123@s.whatsapp.net')).toBeNull(); // too short
    });
  });

  describe('e164ToBaileysJid', () => {
    it('converts E.164 phone string to Baileys @s.whatsapp.net format', () => {
      expect(e164ToBaileysJid('+919876543210')).toBe('919876543210@s.whatsapp.net');
      expect(e164ToBaileysJid('+14155550199')).toBe('14155550199@s.whatsapp.net');
      expect(e164ToBaileysJid('919876543210')).toBe('919876543210@s.whatsapp.net');
    });
  });

  describe('extractMessageText', () => {
    it('extracts plain conversation text', () => {
      const msg: any = {
        message: {
          conversation: 'AUTH-9G3V-W29B',
        },
      };
      expect(extractMessageText(msg)).toBe('AUTH-9G3V-W29B');
    });

    it('extracts extendedTextMessage text', () => {
      const msg: any = {
        message: {
          extendedTextMessage: {
            text: '  Please verify AUTH-481A-992B  ',
          },
        },
      };
      expect(extractMessageText(msg)).toBe('Please verify AUTH-481A-992B');
    });

    it('extracts image caption if present', () => {
      const msg: any = {
        message: {
          imageMessage: {
            caption: 'AUTH-XXXX-YYYY',
          },
        },
      };
      expect(extractMessageText(msg)).toBe('AUTH-XXXX-YYYY');
    });

    it('returns null for media message without text/caption', () => {
      const msg: any = {
        message: {
          audioMessage: {},
        },
      };
      expect(extractMessageText(msg)).toBeNull();
    });
  });
});
