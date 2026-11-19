import { Link } from 'react-router';
import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Common = {
  variant?: 'primary' | 'secondary' | 'danger' | 'dangerText';
  /** `lg` is the primary-action size (60px on phone, 52px on desktop). */
  size?: 'md' | 'lg';
  /** Spans both columns inside a form section grid. */
  wide?: boolean;
};

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };
type LinkProps = Common & {
  to: string;
  className?: string;
  'aria-label'?: string;
  children: React.ReactNode;
};

/** A button, or a router link styled as one when `to` is given. */
const Button = (props: ButtonProps | LinkProps) => {
  const { variant = 'primary', size = 'md', wide = false, className, ...rest } = props;
  const classes = [
    styles.button,
    styles[variant],
    size === 'lg' && styles.lg,
    wide && styles.wide,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (rest.to !== undefined) {
    return (
      <Link
        className={classes}
        to={rest.to}
        aria-label={rest['aria-label']}
      >
        {rest.children}
      </Link>
    );
  }

  const { to: _to, ...buttonProps } = rest;
  return (
    <button
      type="button"
      className={classes}
      {...buttonProps}
    />
  );
};

export default Button;
