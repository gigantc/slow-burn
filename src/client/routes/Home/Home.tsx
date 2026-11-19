import { Link } from 'react-router';
import ActionTile from '@/components/ActionTile/ActionTile';
import EntryList from '@/components/EntryList/EntryList';
import LiveCookCard from '@/components/LiveCookCard/LiveCookCard';
import { LATELY_COUNT } from '@/config';
import { useActiveCook, useCooks } from '@/lib/cookHooks';
import { cookToEntry } from '@/lib/cookInfo';
import { greeting } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import styles from './Home.module.scss';

const Home = () => {
  const { cooks, meats, ready } = useCooks();
  const active = useActiveCook();
  const now = useNow(60_000);

  const meatName = (id: string) => meats.find((meat) => meat.id === id)?.name ?? '';
  const entries = cooks
    .filter((cook) => cook !== active)
    .slice(0, LATELY_COUNT)
    .map((cook) => cookToEntry(cook, meatName(cook.meatId)));

  return (
    <div className={styles.home}>
      <header>
        <p>{greeting(new Date(now))}</p>
        <h1>What's on the fire?</h1>
      </header>
      {active && <LiveCookCard cook={active} />}
      <div className={styles.tiles}>
        <ActionTile
          to="/cooks/new"
          icon="flame"
          label="Start a cook"
          variant="primary"
        />
        <ActionTile
          to="/tastings"
          icon="glass"
          label="Log a tasting"
        />
      </div>
      {ready && (
        <section>
          <header>
            <h2>Lately</h2>
            <Link to="/cooks">See all</Link>
          </header>
          {entries.length > 0 ? (
            <EntryList
              entries={entries}
              phoneThree
            />
          ) : (
            <p>Nothing logged yet. Start a cook and it will show up here.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default Home;
