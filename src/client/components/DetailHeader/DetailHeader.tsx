import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import Button from '@/components/Button/Button';
import Icon from '@/components/Icon/Icon';
import RatingInput from '@/components/RatingInput/RatingInput';
import type { EntryType } from '@/config';
import { useBack } from '@/lib/useBack';
import styles from './DetailHeader.module.scss';

type Props = {
  /** The parent list: desktop breadcrumb target and the phone back button's fallback. */
  crumb: { to: string; label: string; current: string };
  editTo: string;
  editLabel: string;
  /** Phone-only line above the title, colored by the category ("Cook · Nov 8"). */
  eyebrow: string;
  category: EntryType;
  title: string;
  rating: number | null;
  /** Rating saves straight from here. */
  onRate: (rating: number | null) => void;
  /** One quiet line under the stars. */
  meta?: string;
};

/** The top of a Cook or Tasting detail: where you are, the title, an inline rating and Edit. */
const DetailHeader = ({
  crumb,
  editTo,
  editLabel,
  eyebrow,
  category,
  title,
  rating,
  onRate,
  meta,
}: Props) => {
  const back = useBack();

  return (
    <header className={styles.header}>
      <button
        className={styles.back}
        type="button"
        aria-label="Back"
        onClick={() => back(crumb.to)}
      >
        <Icon name="chevronLeft" />
      </button>
      <Breadcrumb
        to={crumb.to}
        label={crumb.label}
        current={crumb.current}
      />
      <Button
        className={styles.edit}
        to={editTo}
        variant="secondary"
        aria-label={editLabel}
      >
        <Icon name="pencil" />
        <span>Edit</span>
      </Button>
      <span className={`${styles.eyebrow} ${styles[category]}`}>{eyebrow}</span>
      <h1>{title}</h1>
      <div className={styles.rating}>
        <RatingInput
          compact
          clearable={false}
          value={rating}
          onChange={onRate}
        />
        {rating === null && <small>Rate it</small>}
      </div>
      {meta && <p className={styles.meta}>{meta}</p>}
    </header>
  );
};

export default DetailHeader;
