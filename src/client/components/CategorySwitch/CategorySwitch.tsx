import { useRovingRadio } from '@/lib/useRovingRadio';
import styles from './CategorySwitch.module.scss';

export type SwitchOption = { value: string; label: string };

type Props = {
  label: string;
  options: readonly SwitchOption[];
  value: string;
  onChange: (value: string) => void;
  /** Option values that are categories: their pill takes the category's color when selected. */
  categories?: readonly string[];
  className?: string;
};

/** A segmented radio group: equal pills, the selected one filled. */
const CategorySwitch = ({ label, options, value, onChange, categories = [], className }: Props) => {
  const roving = useRovingRadio(
    options.map((option) => option.value),
    value,
    onChange,
  );

  return (
    <div
      className={className ? `${styles.switch} ${className}` : styles.switch}
      role="radiogroup"
      aria-label={label}
      onKeyDown={roving.onKeyDown}
    >
      {options.map((option) => (
        <button
          key={option.value}
          className={categories.includes(option.value) ? styles[option.value] : undefined}
          type="button"
          role="radio"
          tabIndex={roving.tabIndex(option.value)}
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default CategorySwitch;
