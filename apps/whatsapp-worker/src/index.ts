import { existsSync } from 'node:fs';
import { join } from 'node:path';
import dotenv from 'dotenv';
import { WhatsAppWorkerService } from './worker.js';

dotenv.config();

const port = Number(process.env.WORKER_PORT || process.env.PORT || 4001);
const authApiUrl = process.env.AUTH_API_URL || 'http://localhost:4000';
const workerSecret = process.env.WORKER_INTERNAL_SECRET || 'worker_secret_key_change_me_in_prod_abcde';
const adapterMode = (process.env.WHATSAPP_ADAPTER as 'mock' | 'baileys') || 'baileys';

function getSessionPath(): string {
  if (process.env.WHATSAPP_SESSION_PATH) return process.env.WHATSAPP_SESSION_PATH;

  const candidates = [
    join(process.cwd(), '.baileys_auth'),
    join(process.cwd(), 'apps', 'whatsapp-worker', '.baileys_auth'),
    join(process.cwd(), '..', '.baileys_auth'),
  ];
  for (const c of candidates) {
    if (existsSync(join(c, 'creds.json'))) {
      return c;
    }
  }
  return join(process.cwd(), '.baileys_auth');
}

const sessionDataPath = getSessionPath();
console.log(`[WHATSAPP WORKER] Using session directory: ${sessionDataPath}`);

const worker = new WhatsAppWorkerService({
  port,
  authApiUrl,
  workerSecret,
  adapterMode,
  sessionDataPath,
});

async function main() {
  try {
    await worker.start();
    console.log(`🚀 WhatsApp Worker started on port ${port} (mode: ${adapterMode})`);
  } catch (err) {
    console.error('Fatal error starting WhatsApp Worker:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('Stopping WhatsApp Worker...');
  await worker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Stopping WhatsApp Worker...');
  await worker.stop();
  process.exit(0);
});

main();
