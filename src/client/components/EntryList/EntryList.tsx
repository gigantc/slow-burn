import EntryLink from '@/components/EntryLink/EntryLink';
import type { Entry } from '@/components/EntryLink/EntryLink';
import { BP_MD } from '@/config';
import { useFeaturedPhotoIndex } from '@/lib/photoHooks';
import { useMediaQuery } from '@/lib/useMediaQuery';
import styles from './EntryList.module.scss';

/** Entries as a card grid on desktop and a compact list on phone. */
const EntryList = ({
  entries,
  phoneCount,
  hideTag = false,
}: {
  entries: readonly Entry[];
  /** Phone shows only the first this many (a teaser); desktop always shows them all. */
  phoneCount?: number;
  /** Leave out each entry's category tag (a list of one category). */
  hideTag?: boolean;
}) => {
  const photos = useFeaturedPhotoIndex();
  const phone = useMediaQuery(`(max-width:${BP_MD}px)`);
  const shown = phone && phoneCount !== undefined ? entries.slice(0, phoneCount) : entries;

  return (
    <ul className={styles.list}>
      {shown.map((entry) => (
        <li key={entry.id}>
          <EntryLink
            entry={entry}
            hideTag={hideTag}
            photo={photos.get(`${entry.category === 'cook' ? 'cook' : 'tasting'}:${entry.id}`)}
          />
        </li>
      ))}
    </ul>
  );
};

export default EntryList;
