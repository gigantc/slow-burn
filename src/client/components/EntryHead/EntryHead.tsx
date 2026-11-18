import type { ReactNode } from 'react';
import { ENTRY_TYPES } from '@/config';
import type { EntryType } from '@/config';
import styles from './EntryHead.module.scss';

type Props = {
  type: EntryType;
  /** Replaces the type name in the small label (e.g. "In progress"). */
  label?: string;
  tags?: string[];
  /** The heading element, rendered between the label and the tags. */
  children: ReactNode;
};

const EntryHead = ({ type, label, tags = [], children }: Props) => (
  <header className={`${styles.head} ${styles[type]}`}>
    <span className={styles.label}>{label ?? ENTRY_TYPES[type].label}</span>
    {children}
    {tags.length > 0 && (
      <ul>
        {tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    )}
  </header>
);

export default EntryHead;
