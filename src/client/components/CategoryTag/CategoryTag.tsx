import { ENTRY_TYPES } from '@/config';
import type { EntryType } from '@/config';
import styles from './CategoryTag.module.scss';

/** Category label tinted with the category's colors. Shape and size are set by the parent. */
const CategoryTag = ({ category, className }: { category: EntryType; className?: string }) => (
  <span className={[styles.tag, styles[category], className].filter(Boolean).join(' ')}>
    {ENTRY_TYPES[category].label}
  </span>
);

export default CategoryTag;
