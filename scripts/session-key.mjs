//////////////////////////////////////
// Prints a random 32-byte hex key for SESSION_KEY.

import { randomBytes } from 'node:crypto';

console.log(randomBytes(32).toString('hex'));
