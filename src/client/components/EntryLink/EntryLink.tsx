import { Link } from 'react-router';
import type { Photo } from 'shared/types';
import CategoryTag from '@/components/CategoryTag/CategoryTag';
import PhotoImage from '@/components/PhotoImage/PhotoImage';
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
 * A row on phone, a card on desktop. With a photo it shows the thumbnail: across the top of the
 * card, or filling the tag column of the row (the tag moves onto its bottom edge).
 */
const EntryLink = ({
  entry,
  hideTag = false,
  photo,
}: {
  entry: Entry;
  hideTag?: boolean;
  photo?: Photo;
}) => (
  <Link
    className={[styles.entry, hideTag && styles.plain, photo && styles.withPhoto]
      .filter(Boolean)
      .join(' ')}
    to={entry.href}
  >
    {/* Decorative: the link's own text already says what it is */}
    {photo && (
      <PhotoImage
        className={styles.photo}
        photo={photo}
        alt=""
      />
    )}
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
