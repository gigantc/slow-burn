//////////////////////////////////////
// Auth state

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AUTH_HINT_KEY } from '@/config';
import { api, ApiRequestError } from '@/lib/api';
import { onAuthLost } from '@/lib/sync';

type Status = 'loading' | 'in' | 'out';

type AuthValue = {
  status: Status;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

// A flag in localStorage lets a reload while offline stay signed in (the session cookie is
// httpOnly, so JS can't see it). The server is still the authority whenever it's reachable.
const setHint = (on: boolean) => {
  try {
    if (on) localStorage.setItem(AUTH_HINT_KEY, '1');
    else localStorage.removeItem(AUTH_HINT_KEY);
  } catch {
    // Storage blocked: offline reloads will land on the login screen.
  }
};

const hasHint = () => {
  try {
    return localStorage.getItem(AUTH_HINT_KEY) === '1';
  } catch {
    return false;
  }
};

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    api('/auth/me')
      .then(() => {
        setHint(true);
        setStatus('in');
      })
      .catch((err) => {
        const offline = err instanceof ApiRequestError && err.status === 0;
        if (offline && hasHint()) {
          setStatus('in');
          return;
        }
        if (!offline) setHint(false);
        setStatus('out');
      });
  }, []);

  useEffect(
    () =>
      onAuthLost(() => {
        setHint(false);
        setStatus('out');
      }),
    [],
  );

  const login = useCallback(async (password: string) => {
    await api('/auth/login', { method: 'POST', body: { password } });
    setHint(true);
    setStatus('in');
  }, []);

  const logout = useCallback(async () => {
    // Signing out works offline too; the cookie then lapses or is replaced on the next login.
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setHint(false);
    setStatus('out');
  }, []);

  const value = useMemo(() => ({ status, login, logout }), [status, login, logout]);

  return <AuthContext value={value}>{children}</AuthContext>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
