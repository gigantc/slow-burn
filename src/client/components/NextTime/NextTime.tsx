import type { ReactNode, TextareaHTMLAttributes } from 'react';
import AutoTextarea from '@/components/AutoTextarea/AutoTextarea';
import Icon from '@/components/Icon/Icon';
import Stars from '@/components/Stars/Stars';
import styles from './NextTime.module.scss';

type CardProps = {
  variant?: 'card';
  className?: string;
  /** The small "From your ..." line; leave it out where the page already says whose cook it is. */
  source?: ReactNode;
  /** That cook's rating; shown after the source on phone only. */
  rating?: number;
  children: ReactNode;
};

type StripProps = {
  variant: 'strip';
  children: ReactNode;
};

type FieldProps = {
  variant: 'field';
  /** Under the eyebrow, e.g. "Shown first when you start your next pork shoulder." */
  hint: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>;

const Eyebrow = () => (
  <strong>
    <Icon name="arrow" />
    Next time
  </strong>
);

/**
 * The note to future you: read-only `card` (New cook, Detail), one-line `strip` (Live) or
 * editable `field` (Wrap-up).
 */
const NextTime = (props: CardProps | StripProps | FieldProps) => {
  if (props.variant === 'strip') {
    return (
      <aside className={`${styles.card} ${styles.strip}`}>
        <Icon name="arrow" />
        <p>
          <strong>Next time:</strong> {props.children}
        </p>
      </aside>
    );
  }

  if (props.variant === 'field') {
    const { variant: _variant, hint, ...rest } = props;
    return (
      <label className={`${styles.card} ${styles.field}`}>
        <Eyebrow />
        <small>{hint}</small>
        <AutoTextarea {...rest} />
      </label>
    );
  }

  const { source, rating, children, className } = props;
  return (
    <aside className={className ? `${styles.card} ${className}` : styles.card}>
      <Eyebrow />
      <p>{children}</p>
      {(source || rating !== undefined) && (
        <small>
          {source}
          {rating !== undefined && (
            <span>
              {' · '}
              <Stars rating={rating} />
            </span>
          )}
        </small>
      )}
    </aside>
  );
};

export default NextTime;
