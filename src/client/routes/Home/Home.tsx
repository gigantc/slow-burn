import { useEffect, useState } from 'react';
import type { Cook } from 'shared/types';
import Button from '@/components/Button/Button';
import { APP_NAME } from '@/config';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import styles from './Home.module.scss';

const Home = () => {
  const { logout } = useAuth();
  const [cooks, setCooks] = useState<Cook[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Cook[]>('/cooks')
      .then(setCooks)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main className={styles.home}>
      <h1>{APP_NAME}</h1>
      <p className={styles.notice}>Placeholder screen. The real cook screens are not built yet.</p>
      <p className={styles.status}>Signed in.</p>
      <p className={styles.status}>
        {error ||
          (cooks === null ? 'Loading cooks...' : `GET /api/cooks returned ${cooks.length} cooks.`)}
      </p>
      <Button variant="secondary" onClick={logout}>
        Sign out
      </Button>
    </main>
  );
};

export default Home;
