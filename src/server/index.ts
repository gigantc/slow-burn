//////////////////////////////////////
// Server entry

import { buildApp } from './app.js';
import { assertConfig, config } from './config.js';
import { closeDb, runMigrations } from './db/index.js';

assertConfig();
runMigrations();

const app = await buildApp();

const shutdown = async () => {
  await app.close();
  closeDb();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port: config.port, host: config.host });
