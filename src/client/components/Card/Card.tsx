import { Link } from 'react-router';
import Icon from '@/components/Icon/Icon';
import { RATING_MAX } from 'shared/constants';
import { ENTRY_TYPES } from '@/config';
import type { EntryType } from '@/config';
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

type AddCardProps = {
  variant: 'add';
  label: string;
  href: string;
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${iso}T00:00:00`),
  );

const Card = (props: EntryCardProps | AddCardProps) => {
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

  const { type, title, tags, date, rating, href } = props;

  return (
    <article className={`${styles.card} ${styles[type]}`}>
      <header>
        <span className={styles.label}>{ENTRY_TYPES[type].label}</span>
        <h3>{href ? <Link to={href}>{title}</Link> : title}</h3>
        {tags.length > 0 && (
          <ul>
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </header>
      <footer>
        <time dateTime={date}>{formatDate(date)}</time>
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
