import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
};

const Button = ({ variant = 'primary', className, ...rest }: Props) => (
  <button
    className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
    {...rest}
  />
);

export default Button;
