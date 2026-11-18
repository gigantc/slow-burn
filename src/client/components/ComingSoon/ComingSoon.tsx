import styles from './ComingSoon.module.scss';

const ComingSoon = ({ title }: { title: string }) => (
  <section className={styles.soon}>
    <h1>{title}</h1>
    <p>This screen is not built yet.</p>
  </section>
);

export default ComingSoon;
