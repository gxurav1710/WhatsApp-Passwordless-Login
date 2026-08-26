import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { BaileysAdapter } from '../../apps/whatsapp-worker/src/adapters/baileys-adapter.js';
import { WhatsAppConnectionStatus } from '@whatsapp-auth/protocol';

describe('WhatsApp Session Logout & Fresh QR Lifecycle', () => {
  const testSessionDir = join(process.cwd(), '.test_baileys_logout_auth');

  beforeEach(() => {
    if (existsSync(testSessionDir)) {
      rmSync(testSessionDir, { recursive: true, force: true });
    }
    mkdirSync(testSessionDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testSessionDir)) {
      rmSync(testSessionDir, { recursive: true, force: true });
    }
  });

  it('initializes with DISCONNECTED status and null client info when no session exists', () => {
    const adapter = new BaileysAdapter(testSessionDir);
    expect(adapter.getStatus()).toBe(WhatsAppConnectionStatus.DISCONNECTED);
    expect(adapter.getClientInfo()).toBeNull();
    expect(adapter.getQrCode()).toBeNull();
  });

  it('wipes session data directory completely upon explicit wipeSessionData call', () => {
    const fakeCreds = join(testSessionDir, 'creds.json');
    const fakeInfo = join(testSessionDir, 'session-info.json');
    writeFileSync(fakeCreds, JSON.stringify({ my: 'creds' }));
    writeFileSync(fakeInfo, JSON.stringify({ phoneNumber: '+14155550199' }));

    expect(existsSync(fakeCreds)).toBe(true);
    expect(existsSync(fakeInfo)).toBe(true);

    const adapter = new BaileysAdapter(testSessionDir);
    adapter.wipeSessionData();

    expect(existsSync(fakeCreds)).toBe(false);
    expect(existsSync(fakeInfo)).toBe(false);
    expect(existsSync(testSessionDir)).toBe(true); // folder recreated empty
  });

  it('cleanly resets status, client info, and QR upon logout()', async () => {
    const adapter = new BaileysAdapter(testSessionDir);

    let disconnectedEmitted = false;
    let disconnectedReason = '';
    adapter.on('disconnected', (reason) => {
      disconnectedEmitted = true;
      disconnectedReason = reason;
    });

    await adapter.logout();

    expect(adapter.getStatus()).toBe(WhatsAppConnectionStatus.DISCONNECTED);
    expect(adapter.getClientInfo()).toBeNull();
    expect(adapter.getQrCode()).toBeNull();
    expect(disconnectedEmitted).toBe(true);
    expect(disconnectedReason).toBe('Logged out');
  });

  it('handles repeated sequential logout() calls without errors or exceptions', async () => {
    const adapter = new BaileysAdapter(testSessionDir);

    await expect(adapter.logout()).resolves.toBeUndefined();
    expect(adapter.getStatus()).toBe(WhatsAppConnectionStatus.DISCONNECTED);
    expect(adapter.getClientInfo()).toBeNull();

    await expect(adapter.logout()).resolves.toBeUndefined();
    expect(adapter.getStatus()).toBe(WhatsAppConnectionStatus.DISCONNECTED);
    expect(adapter.getClientInfo()).toBeNull();

    await expect(adapter.logout()).resolves.toBeUndefined();
    expect(adapter.getStatus()).toBe(WhatsAppConnectionStatus.DISCONNECTED);
    expect(adapter.getClientInfo()).toBeNull();
  });

  it('does not report phone number as active when disconnected even if session file was present', () => {
    const fakeInfo = join(testSessionDir, 'session-info.json');
    writeFileSync(fakeInfo, JSON.stringify({ phoneNumber: '+919212339720', pushname: 'Old User' }));

    const adapter = new BaileysAdapter(testSessionDir);
    // When not CONNECTED, getClientInfo must return null
    expect(adapter.getStatus()).toBe(WhatsAppConnectionStatus.DISCONNECTED);
    expect(adapter.getClientInfo()).toBeNull();
  });
});
