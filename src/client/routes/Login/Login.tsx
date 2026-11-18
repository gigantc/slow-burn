import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router';
import Button from '@/components/Button/Button';
import Field from '@/components/Field/Field';
import { APP_NAME } from '@/config';
import { useAuth } from '@/lib/auth';
import styles from './Login.module.scss';

const Login = () => {
  const { status, login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'in') return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setBusy(false);
    }
  };

  return (
    <main className={styles.login}>
      <h1>{APP_NAME}</h1>
      <p>Smoke, sip, savor, repeat.</p>
      <form onSubmit={onSubmit}>
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          Sign in
        </Button>
      </form>
    </main>
  );
};

export default Login;
