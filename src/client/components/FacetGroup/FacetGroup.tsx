import Chip from '@/components/Chip/Chip';
import styles from './FacetGroup.module.scss';

type Props = {
  label: string;
  options: readonly { value: string; label: string }[];
  selected: readonly string[];
  onToggle: (value: string) => void;
};

/** One filter's options as toggle chips; several can be on (any of them matches). */
const FacetGroup = ({ label, options, selected, onToggle }: Props) => (
  <fieldset className={styles.group}>
    <legend>{label}</legend>
    <div>
      {options.map((option) => (
        <Chip
          key={option.value}
          selected={selected.includes(option.value)}
          onClick={() => onToggle(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  </fieldset>
);

export default FacetGroup;
