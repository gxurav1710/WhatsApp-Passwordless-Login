import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  appUrl: string;
  dashboardUrl: string;
  databaseUrl: string;
  adminApiKey: string;
  sessionSecret: string;
  workerInternalSecret: string;
  workerUrl: string;
  whatsappBotPhone: string;
  challengeTtlSeconds: number;
  loginTokenTtlSeconds: number;
  authCodeTtlSeconds: number;
  challengePrefix: string;
  rateLimitMaxRequests: number;
  rateLimitWindowMs: number;
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 4000),
    host: process.env.HOST || '0.0.0.0',
    appUrl: (process.env.APP_URL || 'http://localhost:4000').replace(/\/+$/, ''),
    dashboardUrl: (process.env.DASHBOARD_URL || 'http://localhost:3000').replace(/\/+$/, ''),
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/whatsapp_auth?schema=public',
    adminApiKey: process.env.ADMIN_API_KEY || 'admin_super_secret_key_change_me_in_prod_12345',
    sessionSecret: process.env.SESSION_SECRET || 'session_secret_key_change_me_in_prod_67890',
    workerInternalSecret: process.env.WORKER_INTERNAL_SECRET || 'worker_secret_key_change_me_in_prod_abcde',
    workerUrl: (process.env.WORKER_URL || 'http://localhost:4001').replace(/\/+$/, ''),
    whatsappBotPhone: process.env.WHATSAPP_BOT_PHONE || '+14155550199',
    challengeTtlSeconds: Number(process.env.CHALLENGE_TTL_SECONDS || 300),
    loginTokenTtlSeconds: Number(process.env.LOGIN_TOKEN_TTL_SECONDS || 120),
    authCodeTtlSeconds: Number(process.env.AUTH_CODE_TTL_SECONDS || 60),
    challengePrefix: process.env.CHALLENGE_PREFIX || 'AUTH',
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS_PER_WINDOW || 100),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  };
}
