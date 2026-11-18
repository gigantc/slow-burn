//////////////////////////////////////
// Manual migration runner (the server also migrates at startup)

import { closeDb, runMigrations } from './index.js';

runMigrations();
closeDb();
console.log('Migrations applied.');
