import Card from '@/components/Card/Card';
import SyncStatus from '@/components/SyncStatus/SyncStatus';
import { useCooks } from '@/lib/cookHooks';
import { cookToCard } from './cookCard';
import styles from './Home.module.scss';

const Home = () => {
  const { cooks, ready } = useCooks();

  return (
    <section className={styles.home}>
      <h1>Recent</h1>
      <SyncStatus quiet />
      {ready && cooks.length === 0 && (
        <p className={styles.note}>No cooks yet. Tap New cook to log your first one.</p>
      )}
      <div className={styles.grid}>
        <Card
          variant="add"
          label="New cook"
          href="/cooks"
        />
        {cooks.map((cook) => (
          <Card
            key={cook.id}
            {...cookToCard(cook)}
          />
        ))}
      </div>
    </section>
  );
};

export default Home;
