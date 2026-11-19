import { Link } from 'react-router';
import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Common = {
  variant?: 'primary' | 'secondary' | 'danger';
  /** `large` keeps the full tap target; the default is compact for forms. */
  size?: 'default' | 'large';
  /** Spans both columns inside a form section grid. */
  wide?: boolean;
};

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };
type LinkProps = Common & { to: string; className?: string; children: React.ReactNode };

/** A button, or a router link styled as one when `to` is given. */
const Button = (props: ButtonProps | LinkProps) => {
  const { variant = 'primary', size = 'default', wide = false, className, ...rest } = props;
  const classes = [
    styles.button,
    styles[variant],
    size === 'large' && styles.large,
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
