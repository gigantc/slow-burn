import type { MouseEvent } from 'react';
import Icon from '@/components/Icon/Icon';
import { THEME_LABELS } from '@/config';
import { useTheme } from '@/lib/theme';
import type { Theme } from '@/lib/theme';
import styles from './ThemeToggle.module.scss';

type Props = {
  /** On the sidebar's sky, where the inactive name takes the sky's dim text color. */
  onSky?: boolean;
  className?: string;
};

const classes = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

/**
 * The Dawn / Dusk switch: both names in view, sun and moon on a track, a thumb that slides to the
 * chosen one. One switch (its label is "Dusk theme", checked = Dusk); clicking a name sets that
 * theme, clicking the track flips it.
 */
const ThemeToggle = ({ onSky = false, className }: Props) => {
  const { theme, toggle, setTheme } = useTheme();

  const click = (e: MouseEvent<HTMLButtonElement>) => {
    const named = (e.target as HTMLElement).closest<HTMLElement>('[data-theme-name]');
    if (named) setTheme(named.dataset.themeName as Theme);
    else toggle();
  };

  return (
    <button
      className={classes(styles.toggle, onSky && styles.sky, className)}
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label={`${THEME_LABELS.dark} theme`}
      onClick={click}
    >
      <span
        data-theme-name="light"
        data-active={theme === 'light'}
      >
        {THEME_LABELS.light}
      </span>
      <span
        className={styles.track}
        aria-hidden="true"
      >
        <span className={styles.thumb} />
        <Icon name="sun" />
        <Icon name="moon" />
      </span>
      <span
        data-theme-name="dark"
        data-active={theme === 'dark'}
      >
        {THEME_LABELS.dark}
      </span>
    </button>
  );
};

export default ThemeToggle;
