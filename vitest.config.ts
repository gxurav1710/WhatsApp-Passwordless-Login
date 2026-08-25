import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/whatsapp_auth?schema=public',
      WORKER_INTERNAL_SECRET: 'test_worker_secret_12345',
      APP_URL: 'http://localhost:4000',
    },
  },
});
