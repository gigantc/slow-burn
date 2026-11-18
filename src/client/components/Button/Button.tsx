import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  /** `large` keeps the full tap target; the default is compact for forms. */
  size?: 'default' | 'large';
  /** Spans both columns inside a form section grid. */
  wide?: boolean;
};

const Button = ({
  variant = 'primary',
  size = 'default',
  wide = false,
  className,
  ...rest
}: Props) => (
  <button
    type="button"
    className={[
      styles.button,
      styles[variant],
      size === 'large' && styles.large,
      wide && styles.wide,
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  />
);

export default Button;
