import Icon from '@/components/Icon/Icon';
import styles from './SearchField.module.scss';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** A search box: icon and input on a card pill, 48px. */
const SearchField = ({ label, value, onChange, className }: Props) => (
  <label className={className ? `${styles.search} ${className}` : styles.search}>
    <Icon name="search" />
    <span>{label}</span>
    <input
      type="search"
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);

export default SearchField;
