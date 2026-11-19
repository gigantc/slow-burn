//////////////////////////////////////
// Login throttling
// The repo is public, so the sign-in endpoint is known and the single password is the only
// thing between the internet and the journal. Failed attempts are counted per IP and across
// all IPs (a distributed guess run); a blocked request is refused before scrypt runs. State
// is in memory: a restart clears it, which is fine for a self-hosted single-user app.

import { config } from '../config.js';

type Bucket = { count: number; resetAt: number };

const createLoginLimiter = () => {
  const perIp = new Map<string, Bucket>();
  let global: Bucket = { count: 0, resetAt: 0 };

  const prune = (now: number) => {
    for (const [ip, b] of perIp) if (b.resetAt <= now) perIp.delete(ip);
  };

  // Unref'd so it never keeps the process alive
  setInterval(() => prune(Date.now()), config.loginWindowMs).unref();

  const secondsLeft = (b: Bucket, now: number) => Math.max(1, Math.ceil((b.resetAt - now) / 1000));

  return {
    // Seconds until the caller may try again, or 0 if allowed. A valid session bypasses
    // only the global cap, so the owner can still sign in again during a distributed attack.
    check: (ip: string, hasSession: boolean) => {
      const now = Date.now();
      const b = perIp.get(ip);
      if (b && b.resetAt > now && b.count >= config.loginMaxFailuresPerIp) {
        return secondsLeft(b, now);
      }
      if (!hasSession && global.resetAt > now && global.count >= config.loginMaxFailuresGlobal) {
        return secondsLeft(global, now);
      }
      return 0;
    },

    fail: (ip: string) => {
      const now = Date.now();
      const resetAt = now + config.loginWindowMs;

      if (global.resetAt <= now) global = { count: 0, resetAt };
      global.count += 1;

      const b = perIp.get(ip);
      if (b && b.resetAt > now) {
        b.count += 1;
        return;
      }
      if (perIp.size >= config.loginTrackedIpsMax) {
        prune(now);
        // Still full: drop the oldest entry (Map keeps insertion order)
        if (perIp.size >= config.loginTrackedIpsMax) {
          const oldest = perIp.keys().next().value;
          if (oldest !== undefined) perIp.delete(oldest);
        }
      }
      perIp.set(ip, { count: 1, resetAt });
    },

    succeed: (ip: string) => {
      perIp.delete(ip);
    },

    size: () => perIp.size,
  };
};

export const loginLimiter = createLoginLimiter();
