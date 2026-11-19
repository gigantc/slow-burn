//////////////////////////////////////
// Server config
// Every env var and server constant lives here.

import { resolve } from 'node:path';

const env = process.env;

export const config = {
  nodeEnv: env.NODE_ENV ?? 'development',
  isProd: env.NODE_ENV === 'production',
  port: Number(env.PORT ?? 3100),
  // Only the local Apache hop is trusted for X-Forwarded-*; trusting every hop would let a client
  // pick its own IP by sending a spoofed X-Forwarded-For (which defeats login throttling).
  trustProxy: env.NODE_ENV === 'production' ? (env.TRUST_PROXY ?? '127.0.0.1') : false,
  host: env.HOST ?? '127.0.0.1',
  dbPath: resolve(env.DB_PATH ?? './data/slowburn.db'),
  // Photo files (see server/photos/storage.ts). Relative paths resolve from the working directory.
  photosDir: resolve(env.PHOTOS_DIR ?? './data/photos'),
  sessionKey: env.SESSION_KEY ?? '',
  passwordHash: env.APP_PASSWORD_HASH ?? '',
  sessionCookie: 'slowburn_session',
  sessionMaxAgeSeconds: 60 * 60 * 24 * 365,
  // Login throttling (see auth/rateLimit.ts)
  loginWindowMs: 15 * 60 * 1000,
  loginMaxFailuresPerIp: 5,
  loginMaxFailuresGlobal: 50,
  loginTrackedIpsMax: 1000,
  // Relative to the working directory (repo root in dev, /opt/slow-burn in prod)
  clientDir: resolve('dist/client'),
  migrationsDir: resolve('drizzle'),
} as const;

export const assertConfig = () => {
  if (!/^[0-9a-f]{64}$/i.test(config.sessionKey)) {
    throw new Error('SESSION_KEY must be 64 hex chars. Run: npm run session-key');
  }
  if (!config.passwordHash) {
    throw new Error('APP_PASSWORD_HASH is not set. Run: npm run hash-password');
  }
};
