import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  /** `large` keeps the full tap target; the default is compact for forms. */
  size?: 'default' | 'large';
};

const Button = ({ variant = 'primary', size = 'default', className, ...rest }: Props) => (
  <button
    className={[styles.button, styles[variant], size === 'large' && styles.large, className]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  />
);

export default Button;
