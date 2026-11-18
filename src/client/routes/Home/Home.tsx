import Card from '@/components/Card/Card';
import { sampleCards } from './sampleCards';
import styles from './Home.module.scss';

const Home = () => (
  <section className={styles.home}>
    <h1>Recent</h1>
    <p className={styles.note}>Sample data. These entries are placeholders.</p>
    <div className={styles.grid}>
      <Card
        variant="add"
        label="New cook"
        href="/cooks"
      />
      {sampleCards.map((card) => (
        <Card
          key={card.title}
          {...card}
        />
      ))}
    </div>
  </section>
);

export default Home;
