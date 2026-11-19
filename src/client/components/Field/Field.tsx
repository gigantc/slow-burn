import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.scss';

type Common = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  /** Spans both columns when inside a form grid. */
  wide?: boolean;
};

export type InputProps = Common & {
  multiline?: false;
  /** Makes it a number field: a big tabular value with this unit after it (lb, °F). */
  unit?: string;
  /** A control shown inside the card after the input (e.g. a show/hide button). */
  action?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

type TextareaProps = Common & { multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>;

// A card with the label above and a borderless control inside. Three looks: number (with a
// unit), text (the default) and textarea (multiline).
const Field = (props: InputProps | TextareaProps) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const { label, hint, error, className, wide } = props;

  const classes = [
    styles.field,
    props.multiline ? styles.textarea : props.unit ? styles.number : styles.text,
    wide && styles.wide,
    error && styles.invalid,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const shared = {
    id,
    'aria-describedby': [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : undefined,
  } as const;

  let control: ReactNode;
  if (props.multiline) {
    const {
      label: _label,
      hint: _hint,
      error: _error,
      className: _className,
      wide: _wide,
      multiline: _multiline,
      ...rest
    } = props;
    control = (
      <textarea
        {...shared}
        {...rest}
      />
    );
  } else {
    const {
      label: _label,
      hint: _hint,
      error: _error,
      className: _className,
      wide: _wide,
      multiline: _multiline,
      unit,
      action,
      ...rest
    } = props;
    control = (
      <span className={styles.control}>
        <input
          {...shared}
          {...rest}
        />
        {unit && <span>{unit}</span>}
        {action}
      </span>
    );
  }

  return (
    <div className={classes}>
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
};

export default Field;
