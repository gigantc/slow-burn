import styles from './TempTile.module.scss';

type Props = {
  label: string;
  /** Latest reading in °F, or null for none yet. */
  value: number | null;
  /** Target in °F; without one there is no "/ target" and no bar. */
  target: number | null;
  /** 0 to 1 of the way to the target; ignored without a target. */
  progress: number;
  series: 'pit' | 'meat';
};

/** A temperature with its target and a 6px progress bar. */
const TempTile = ({ label, value, target, progress, series }: Props) => {
  const percent = value === null ? 0 : Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className={`${styles.tile} ${styles[series]}`}>
      <small>{label}</small>
      <p>
        <data value={value ?? undefined}>{value === null ? '--' : `${value}°`}</data>
        {target !== null && <small>{`/ ${target}°`}</small>}
      </p>
      {target !== null && (
        <progress
          value={percent}
          max={100}
          aria-label={`${label} ${percent}% of the way to ${target} degrees`}
        />
      )}
    </div>
  );
};

export default TempTile;
