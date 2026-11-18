import { Link } from 'react-router';
import { RATING_MAX } from 'shared/constants';
import EntryHead from '@/components/EntryHead/EntryHead';
import Icon from '@/components/Icon/Icon';
import type { EntryType } from '@/config';
import { formatDay } from '@/lib/format';
import styles from './Card.module.scss';

export type EntryCardProps = {
  variant?: 'entry';
  type: EntryType;
  title: string;
  tags: string[];
  /** ISO date, YYYY-MM-DD */
  date: string;
  rating?: number;
  href?: string;
};

type ResumeCardProps = {
  variant: 'resume';
  title: string;
  tags: string[];
  /** e.g. "Started 8:00 AM · 3h 12m" */
  status: string;
  href: string;
};

type AddCardProps = {
  variant: 'add';
  label: string;
  href: string;
};

const Card = (props: EntryCardProps | ResumeCardProps | AddCardProps) => {
  if (props.variant === 'add') {
    return (
      <Link
        className={`${styles.card} ${styles.add}`}
        to={props.href}
      >
        <Icon name="plus" />
        {props.label}
      </Link>
    );
  }

  if (props.variant === 'resume') {
    return (
      <article className={`${styles.card} ${styles.resume}`}>
        <EntryHead
          type="cook"
          label="In progress"
          tags={props.tags}
        >
          <h3>
            <Link to={props.href}>{props.title}</Link>
          </h3>
        </EntryHead>
        <footer>
          <span>{props.status}</span>
          <strong>Resume</strong>
        </footer>
      </article>
    );
  }

  const { type, title, tags, date, rating, href } = props;

  return (
    <article className={styles.card}>
      <EntryHead
        type={type}
        tags={tags}
      >
        <h3>{href ? <Link to={href}>{title}</Link> : title}</h3>
      </EntryHead>
      <footer>
        <time dateTime={date}>{formatDay(date)}</time>
        {rating !== undefined && (
          <span
            role="img"
            aria-label={`${rating} out of ${RATING_MAX} stars`}
          >
            {'★'.repeat(rating)}
            {'☆'.repeat(RATING_MAX - rating)}
          </span>
        )}
      </footer>
    </article>
  );
};

export default Card;
