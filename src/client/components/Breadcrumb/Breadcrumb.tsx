import { Link } from 'react-router';
import styles from './Breadcrumb.module.scss';

/** Back link at the top of a screen that has no action bar. */
const Breadcrumb = ({ to, label }: { to: string; label: string }) => (
  <nav
    className={styles.crumb}
    aria-label="Breadcrumb"
  >
    <Link to={to}>{`← ${label}`}</Link>
  </nav>
);

export default Breadcrumb;
