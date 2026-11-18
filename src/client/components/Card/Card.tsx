import { Link } from 'react-router';
import Stars from '@/components/Stars/Stars';
import EntryHead from '@/components/EntryHead/EntryHead';
import Icon from '@/components/Icon/Icon';
import type { EntryType } from '@/config';
import { formatDayShort } from '@/lib/format';
import styles from './Card.module.scss';

export type EntryCardProps = {
  variant?: 'entry';
  type: EntryType;
  title: string;
  tags: string[];
  /** ISO date, YYYY-MM-DD; shown under the title */
  date: string;
  /** Left of the footer, e.g. total time */
  detail?: string;
  rating?: number;
  href?: string;
};

type ResumeCardProps = {
  variant: 'resume';
  title: string;
  tags: string[];
  /** ISO date, YYYY-MM-DD; shown under the title */
  date: string;
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
          <p>{formatDayShort(props.date)}</p>
        </EntryHead>
        <footer>
          <span>{props.status}</span>
          <strong>Resume</strong>
        </footer>
      </article>
    );
  }

  const { type, title, tags, date, detail, rating, href } = props;

  return (
    <article className={styles.card}>
      <EntryHead
        type={type}
        tags={tags}
      >
        <h3>{href ? <Link to={href}>{title}</Link> : title}</h3>
        <p>{formatDayShort(date)}</p>
      </EntryHead>
      <footer>
        <span>{detail}</span>
        {rating !== undefined && <Stars rating={rating} />}
      </footer>
    </article>
  );
};

export default Card;
