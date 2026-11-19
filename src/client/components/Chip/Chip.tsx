import type { ButtonHTMLAttributes } from 'react';
import styles from './Chip.module.scss';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Toggle state: adds the accent ring and `aria-pressed`. Omit for a plain action chip. */
  selected?: boolean;
  /** One of a group (inside a `role="radiogroup"`): `role="radio"` and `aria-checked`, and the
   * chosen chip is filled with the category color instead of ringed. */
  radio?: boolean;
};

const Chip = ({ selected, radio, className, ...rest }: Props) => (
  <button
    type="button"
    className={className ? `${styles.chip} ${className}` : styles.chip}
    {...(radio ? { role: 'radio', 'aria-checked': selected } : { 'aria-pressed': selected })}
    {...rest}
  />
);

export default Chip;
