import { loadConfig } from './config.js';
import { createServer } from './server.js';
import { disconnectPrisma } from '@whatsapp-auth/db';

const config = loadConfig();

async function main() {
  try {
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
