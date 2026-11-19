import { Link } from 'react-router';
import CategoryTag from '@/components/CategoryTag/CategoryTag';
import Stars from '@/components/Stars/Stars';
import type { EntryType } from '@/config';
import styles from './EntryLink.module.scss';

/** What any logged entry (cook, tasting) needs to appear in a list. */
export type Entry = {
  id: string;
  category: EntryType;
  name: string;
  /** One line under the name, e.g. "Nov 8 · 11h 40m · Post oak" */
  meta: string;
  rating?: number;
  href: string;
};

/**
 * A row on phone, a card on desktop. It always carries its category: a wash of the category color
 * and stars in that color. `hideTag` only leaves out the category tag (a list of one category).
 */
const EntryLink = ({ entry, hideTag = false }: { entry: Entry; hideTag?: boolean }) => (
  <Link
    className={[styles.entry, styles[entry.category], styles.washed, hideTag && styles.plain]
      .filter(Boolean)
      .join(' ')}
    to={entry.href}
  >
    {!hideTag && (
      <CategoryTag
        className={styles.tag}
        category={entry.category}
      />
    )}
    <h3>{entry.name}</h3>
    <small
      className={styles.meta}
      title={entry.meta}
    >
      {entry.meta}
    </small>
    <Stars
      className={styles.stars}
      rating={entry.rating}
    />
  </Link>
);

export default EntryLink;
