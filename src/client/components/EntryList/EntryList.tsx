import EntryLink from '@/components/EntryLink/EntryLink';
import type { Entry } from '@/components/EntryLink/EntryLink';
import styles from './EntryList.module.scss';

/** Entries as a card grid on desktop and a compact list on phone. */
const EntryList = ({
  entries,
  phoneThree = false,
  hideTag = false,
}: {
  entries: readonly Entry[];
  /** Phone shows only the first three (a teaser); desktop always shows them all. */
  phoneThree?: boolean;
  /** Leave out each entry's category tag (a list of one category). */
  hideTag?: boolean;
}) => (
  <ul className={phoneThree ? `${styles.list} ${styles.three}` : styles.list}>
    {entries.map((entry) => (
      <li key={entry.id}>
        <EntryLink
          entry={entry}
          hideTag={hideTag}
        />
      </li>
    ))}
  </ul>
);

export default EntryList;
