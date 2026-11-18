import Icon from '@/components/Icon/Icon';
import { THEME_LABELS } from '@/config';
import { useTheme } from '@/lib/theme';

// Unstyled on purpose: it takes its look from the container it sits in (see Nav).
const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      aria-label={`Switch to ${THEME_LABELS[next]} theme`}
      onClick={toggle}
    >
      <Icon name={next === 'dark' ? 'moon' : 'sun'} />
      {THEME_LABELS[next]}
    </button>
  );
};

export default ThemeToggle;
