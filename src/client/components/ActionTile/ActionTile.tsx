import { Link } from 'react-router';
import Icon from '@/components/Icon/Icon';
import type { IconName } from '@/components/Icon/Icon';
import styles from './ActionTile.module.scss';

/** Big phone-first link tile: icon top left, label bottom left. */
const ActionTile = ({
  to,
  icon,
  label,
  variant = 'secondary',
}: {
  to: string;
  icon: IconName;
  label: string;
  variant?: 'primary' | 'secondary';
}) => (
  <Link
    className={`${styles.tile} ${styles[variant]}`}
    to={to}
  >
    <Icon name={icon} />
    {label}
  </Link>
);

export default ActionTile;
