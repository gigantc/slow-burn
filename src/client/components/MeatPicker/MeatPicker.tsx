import { useId, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { meatKey } from 'shared/meats';
import Field from '@/components/Field/Field';
import { addMeat } from '@/lib/cookActions';
import { useMeatName, useMeats } from '@/lib/cookHooks';
import styles from './MeatPicker.module.scss';

type Props = {
  label: string;
  /** Selected meat id, or '' for none. */
  value: string;
  onChange: (meatId: string) => void;
  error?: string;
  wide?: boolean;
};

// ARIA 1.2 combobox with a listbox popup. Opening shows every meat (most used first); typing
// filters on the normalized name; if nothing matches exactly the last option adds the typed text.
const MeatPicker = ({ label, value, onChange, error, wide = false }: Props) => {
  const meats = useMeats();
  const selectedName = useMeatName(value);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const text = typed ?? selectedName;
  const key = meatKey(typed ?? '');
  const options = useMemo(() => {
    const matches = key ? meats.filter((meat) => meat.nameKey.includes(key)) : meats;
    const exact = meats.some((meat) => meat.nameKey === key);
    return [
      ...matches.map((meat) => ({ kind: 'meat' as const, id: meat.id, label: meat.name })),
      ...(key && !exact
        ? [{ kind: 'add' as const, id: 'add', label: `+ Add "${(typed ?? '').trim()}"` }]
        : []),
    ];
  }, [meats, key, typed]);

  const optionId = (index: number) => `${listId}-${index}`;

  const close = () => {
    setOpen(false);
    setTyped(null);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.kind === 'add' ? addMeat(typed ?? '').id : option.id);
    close();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((index) => (index + step + options.length) % Math.max(options.length, 1));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  return (
    <div className={wide ? `${styles.picker} ${styles.wide}` : styles.picker}>
      <Field
        label={label}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options.length > 0 ? optionId(active) : undefined}
        aria-required
        autoComplete="off"
        placeholder="Choose or add a meat"
        value={text}
        error={error}
        onFocus={() => setOpen(true)}
        onBlur={close}
        onChange={(e) => {
          setTyped(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
        >
          {options.length === 0 && <li className={styles.empty}>No meats yet</li>}
          {options.map((option, index) => (
            <li
              key={option.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              className={option.kind === 'add' ? styles.add : undefined}
              // mousedown, not click: the input must keep focus or onBlur closes the list first
              onMouseDown={(e) => {
                e.preventDefault();
                choose(index);
              }}
              onMouseEnter={() => setActive(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MeatPicker;
