import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router';
import Button from '@/components/Button/Button';
import PasswordField from '@/components/PasswordField/PasswordField';
import Logo from '@/components/Logo/Logo';
import { ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import styles from './Login.module.scss';

const Login = () => {
  const { status, login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'in')
    return (
      <Navigate
        to="/"
        replace
      />
    );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(password);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 429) {
        const minutes = Math.max(1, Math.ceil((err.retryAfter ?? 60) / 60));
        setError(
          `Too many attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
        );
      } else {
        setError(err instanceof Error ? err.message : 'Could not sign in.');
      }
      setBusy(false);
    }
  };

  return (
    <main className={styles.login}>
      <form onSubmit={onSubmit}>
        <h1>
          <Logo variant="badge" />
        </h1>
        <PasswordField
          className={styles.field}
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p
            className={styles.error}
            role="alert"
          >
            {error}
          </p>
        )}
        <Button
          size="lg"
          type="submit"
          disabled={busy}
        >
          Sign in
        </Button>
      </form>
    </main>
  );
};

export default Login;
