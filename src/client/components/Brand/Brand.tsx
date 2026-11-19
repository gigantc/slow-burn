import { Link } from 'react-router';
import Logo from '@/components/Logo/Logo';
import styles from './Brand.module.scss';

/** The horizontal logo as a link home. Used by the desktop sidebar and the phone header. */
const Brand = ({ className }: { className?: string }) => (
  <Link
    className={className ? `${styles.brand} ${className}` : styles.brand}
    to="/"
  >
    <Logo />
  </Link>
);

export default Brand;
