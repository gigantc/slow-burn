import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.scss';

type Common = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  /** Spans both columns when inside a form section grid. */
  wide?: boolean;
};

type Props =
  | (Common & { multiline?: false } & InputHTMLAttributes<HTMLInputElement>)
  | (Common & { multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>);

const Field = (props: Props) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const extra = (wide?: boolean, className?: string) =>
    [wide && styles.wide, className].filter(Boolean).join(' ') || undefined;

  const wrap = (
    label: string,
    hint: string | undefined,
    className: string | undefined,
    control: ReactNode,
    error?: string,
  ) => (
    <div className={className ? `${styles.field} ${className}` : styles.field}>
      <label htmlFor={id}>{label}</label>
      {hint && <p id={hintId}>{hint}</p>}
      {control}
      {error && (
        <p
          id={errorId}
          role="alert"
          className={styles.error}
        >
          {error}
        </p>
      )}
    </div>
  );

  if (props.multiline) {
    const { label, hint, error, className, wide, multiline: _multiline, ...rest } = props;
    return wrap(
      label,
      hint,
      extra(wide, className),
      <textarea
        id={id}
        aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        {...rest}
      />,
      error,
    );
  }

  const { label, hint, error, className, wide, multiline: _multiline, ...rest } = props;
  return wrap(
    label,
    hint,
    extra(wide, className),
    <input
      id={id}
      aria-describedby={[hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined}
      aria-invalid={error ? true : undefined}
      {...rest}
    />,
    error,
  );
};

export default Field;
