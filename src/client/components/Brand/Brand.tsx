import { Link } from 'react-router';
import Logo from '@/components/Logo/Logo';
import { APP_NAME } from '@/config';
import styles from './Brand.module.scss';

/** Logo and wordmark, linking home. Used by the desktop sidebar and the phone header. */
const Brand = ({ className }: { className?: string }) => (
  <Link
    className={className ? `${styles.brand} ${className}` : styles.brand}
    to="/"
  >
    <Logo />
    {APP_NAME}
  </Link>
);

export default Brand;
