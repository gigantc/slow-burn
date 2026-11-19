import Chip from '@/components/Chip/Chip';
import { useRovingRadio } from '@/lib/useRovingRadio';
import styles from './ChoiceField.module.scss';

type Props = {
  label: string;
  options: readonly string[];
  /** The chosen option, or '' for none. */
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** One pick from a short list: a legend over a row of Chips, on the page (like RatingInput). Tapping the chosen chip clears it. */
const ChoiceField = ({ label, options, value, onChange, className }: Props) => {
  const roving = useRovingRadio(options, value, onChange);

  return (
    <fieldset className={className ? `${styles.field} ${className}` : styles.field}>
      <legend>{label}</legend>
      <div
        role="radiogroup"
        aria-label={label}
        onKeyDown={roving.onKeyDown}
      >
        {options.map((option) => (
          <Chip
            key={option}
            radio
            tabIndex={roving.tabIndex(option)}
            selected={option === value}
            onClick={() => onChange(option === value ? '' : option)}
          >
            {option}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
};

export default ChoiceField;
