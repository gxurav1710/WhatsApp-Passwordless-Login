import { execSync } from 'node:child_process';
import { loadConfig } from './config.js';
import { createServer } from './server.js';
import { getPrismaClient, disconnectPrisma } from '@whatsapp-auth/db';

const config = loadConfig();

async function ensureDatabaseReady(databaseUrl: string, maxRetries = 15): Promise<void> {
  const prisma = getPrismaClient(databaseUrl);
  let connected = false;

  for (let i = 1; i <= maxRetries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      connected = true;
      break;
    } catch (err) {
      console.log(`[DB] Waiting for database connection (${i}/${maxRetries})...`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  if (!connected) {
    throw new Error('Could not connect to database after maximum retries.');
  }

  // Ensure tables exist on brand new database
  try {
    const tableCount: any = await prisma.$queryRaw`
      SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_sessions';
    `;
    const exists = Number(tableCount[0]?.count || 0) > 0;
    if (!exists) {
      console.log('[DB] Fresh database detected. Synchronizing Prisma schema...');
      execSync('npx prisma db push --schema=./packages/db/prisma/schema.prisma --skip-generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: databaseUrl },
      });
      console.log('[DB] Schema synchronized successfully.');
    }
  } catch (err) {
    console.warn('[DB] Schema sync notice:', err);
  }
}

async function main() {
  try {
    await ensureDatabaseReady(config.databaseUrl);
    const server = await createServer(config);
    await server.listen({ port: config.port, host: config.host });
    console.log(`🚀 Auth Core API running at http://${config.host}:${config.port}`);
    console.log(`📚 OpenAPI / Swagger documentation available at http://${config.host}:${config.port}/docs`);
  } catch (err) {
    console.error('Fatal error starting Auth Core API:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('Shutting down Auth API...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down Auth API...');
  await disconnectPrisma();
  process.exit(0);
});

main();
