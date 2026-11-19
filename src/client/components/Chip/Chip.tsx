import type { ButtonHTMLAttributes } from 'react';
import styles from './Chip.module.scss';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Toggle state: adds the accent ring and `aria-pressed`. Omit for a plain action chip. */
  selected?: boolean;
};

const Chip = ({ selected, className, ...rest }: Props) => (
  <button
    type="button"
    className={className ? `${styles.chip} ${className}` : styles.chip}
    aria-pressed={selected}
    {...rest}
  />
);

export default Chip;
