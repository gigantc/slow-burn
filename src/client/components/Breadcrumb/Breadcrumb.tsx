import { Link } from 'react-router';
import styles from './Breadcrumb.module.scss';

type Props = {
  to: string;
  label: string;
  /** The current screen: renders "Label / current" instead of a back arrow. */
  current?: string;
};

/** Trail at the top of a screen: "Cooks / New cook", or just a back link when `current` is omitted. */
const Breadcrumb = ({ to, label, current }: Props) => (
  <nav
    className={current ? `${styles.crumb} ${styles.trail}` : styles.crumb}
    aria-label="Breadcrumb"
  >
    {current ? (
      <>
        <Link to={to}>{label}</Link>
        {' / '}
        <span aria-current="page">{current}</span>
      </>
    ) : (
      <Link to={to}>{`← ${label}`}</Link>
    )}
  </nav>
);

export default Breadcrumb;
