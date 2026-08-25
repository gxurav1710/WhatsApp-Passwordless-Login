import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// 1. Automatically locate and load .env across all potential monorepo workspace depths
dotenv.config();
const searchPaths = [
  join(process.cwd(), '.env'),
  join(process.cwd(), '..', '.env'),
  join(process.cwd(), '..', '..', '.env'),
];

for (const p of searchPaths) {
  if (existsSync(p)) {
    dotenv.config({ path: p });
  }
}

// 2. Ensure fallback default DATABASE_URL is always injected into process.env
const DEFAULT_DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/whatsapp_auth?schema=public';

process.env.DATABASE_URL = DEFAULT_DATABASE_URL;

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(customDatabaseUrl?: string): PrismaClient {
  if (!prismaInstance) {
    const url = customDatabaseUrl || process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
    process.env.DATABASE_URL = url;

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
