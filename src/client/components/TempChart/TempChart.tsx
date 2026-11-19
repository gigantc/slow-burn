import { clockTime } from '@/lib/format';
import styles from './TempChart.module.scss';

export type Reading = { at: number; value: number };

type Props = {
  title?: string;
  /** Pit and meat readings in °F, oldest first; `at` is epoch ms. */
  pit: readonly Reading[];
  meat: readonly Reading[];
  /** The chart spans start to end (epoch ms). */
  start: number;
  end: number;
  /** Dashed horizontal line at the meat's target temperature. */
  targetMeat?: number | null;
  /** Dashed vertical line where the meat was wrapped (epoch ms). */
  wrapAt?: number | null;
};

const WIDTH = 600;
const HEIGHT = 170;
const PAD = 12;
const MIN_SPAN = 60;

const summary = (pit: readonly Reading[], meat: readonly Reading[], target?: number | null) => {
  const parts: string[] = [];
  if (pit.length > 0) {
    const values = pit.map((r) => r.value);
    parts.push(
      `Pit between ${Math.min(...values)} and ${Math.max(...values)} degrees, latest ${values[values.length - 1]}.`,
    );
  }
  if (meat.length > 0) {
    const first = meat[0]?.value;
    const last = meat[meat.length - 1]?.value;
    parts.push(`Meat from ${first} to ${last} degrees${target ? `, target ${target}` : ''}.`);
  }
  return parts.join(' ');
};

/** Pit and meat temperatures over the cook: a fluid inline SVG with no chart library. */
const TempChart = ({ title = 'So far', pit, meat, start, end, targetMeat, wrapAt }: Props) => {
  const values = [...pit, ...meat].map((r) => r.value);
  if (targetMeat) values.push(targetMeat);
  // Breathing room above and below, and never a span under MIN_SPAN degrees so a couple of
  // close readings don't look like a swing.
  const pad = Math.max(8, (Math.max(...values) - Math.min(...values)) * 0.1);
  const middle = (Math.max(...values) + Math.min(...values)) / 2;
  const span = Math.max(MIN_SPAN, Math.max(...values) - Math.min(...values) + pad * 2);
  const low = middle - span / 2;
  const duration = Math.max(1, end - start);

  const x = (at: number) => ((at - start) / duration) * WIDTH;
  const y = (value: number) => PAD + (1 - (value - low) / span) * (HEIGHT - PAD * 2);
  const line = (list: readonly Reading[]) =>
    list.map((r) => `${x(r.at).toFixed(1)},${y(r.value).toFixed(1)}`).join(' ');
  const latest = meat[meat.length - 1];

  return (
    <figure className={styles.chart}>
      <figcaption>
        <h3>{title}</h3>
        <span>Pit</span>
        <span className={styles.meat}>Meat</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={summary(pit, meat, targetMeat)}
      >
        {targetMeat ? (
          <line
            className={styles.target}
            x1={0}
            x2={WIDTH}
            y1={y(targetMeat)}
            y2={y(targetMeat)}
          />
        ) : null}
        {wrapAt ? (
          <line
            className={styles.wrap}
            x1={x(wrapAt)}
            x2={x(wrapAt)}
            y1={0}
            y2={HEIGHT}
          />
        ) : null}
        {pit.length > 1 && (
          <polyline
            className={styles.pitLine}
            points={line(pit)}
          />
        )}
        {meat.length > 1 && (
          <polyline
            className={styles.meatLine}
            points={line(meat)}
          />
        )}
        {pit.map((r) => (
          <line
            key={`pit-${r.at}`}
            className={styles.pitDot}
            x1={x(r.at)}
            x2={x(r.at)}
            y1={y(r.value)}
            y2={y(r.value)}
          />
        ))}
        {meat.map((r) => (
          // A zero-length round-capped line is a dot that stays round while the SVG stretches
          <line
            key={`meat-${r.at}`}
            className={r === latest ? styles.latest : styles.meatDot}
            x1={x(r.at)}
            x2={x(r.at)}
            y1={y(r.value)}
            y2={y(r.value)}
          />
        ))}
      </svg>
      <p>
        <time dateTime={new Date(start).toISOString()}>{clockTime(start)}</time>
        <time dateTime={new Date(end).toISOString()}>{clockTime(end)}</time>
      </p>
    </figure>
  );
};

export default TempChart;
