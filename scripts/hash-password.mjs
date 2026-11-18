//////////////////////////////////////
// Prints a scrypt hash for APP_PASSWORD_HASH.
// Usage: npm run hash-password            (prompts, input hidden)
//        npm run hash-password -- 'pw'    (visible in shell history)
// Format must match src/server/auth/password.ts: scrypt:<saltHex>:<hashHex>

import { randomBytes, scryptSync } from 'node:crypto';
import readline from 'node:readline';

const KEY_LENGTH = 64;

const prompt = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(question);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });

const password = process.argv[2] ?? (await prompt('Password: '));

if (!password) {
  console.error('Password cannot be empty.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, KEY_LENGTH);
console.log(`scrypt:${salt.toString('hex')}:${hash.toString('hex')}`);
