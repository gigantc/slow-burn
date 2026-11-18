//////////////////////////////////////
// Auth state

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';

type Status = 'loading' | 'in' | 'out';

type AuthValue = {
  status: Status;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    api('/auth/me')
      .then(() => setStatus('in'))
      .catch(() => setStatus('out'));
  }, []);

  const login = useCallback(async (password: string) => {
    await api('/auth/login', { method: 'POST', body: { password } });
    setStatus('in');
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' });
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
