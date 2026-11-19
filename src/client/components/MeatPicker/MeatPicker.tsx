import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { meatKey } from 'shared/meats';
import Chip from '@/components/Chip/Chip';
import Icon from '@/components/Icon/Icon';
import { MEAT_CHIP_COUNT } from '@/config';
import { addMeat } from '@/lib/cookActions';
import { useCooks, useMeatName, useMeats } from '@/lib/cookHooks';
import { rankStaples } from '@/lib/meats';
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
  const { cooks, meats: allMeats } = useCooks();
  const selectedName = useMeatName(value);
  const listId = useId();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
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

  const chips = useMemo(
    () =>
      rankStaples(allMeats, cooks)
        .filter((meat) => meat.id !== value)
        .slice(0, MEAT_CHIP_COUNT),
    [allMeats, cooks, value],
  );

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

  // "+ New meat": an empty combobox, so typing offers to add what's typed.
  const startNew = () => {
    inputRef.current?.focus();
    setTyped('');
    setActive(0);
    setOpen(true);
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
      <label htmlFor={inputId}>{label}</label>
      <div className={styles.control}>
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options.length > 0 ? optionId(active) : undefined}
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          autoComplete="off"
          placeholder="Choose or add a meat"
          value={text}
          onFocus={() => setOpen(true)}
          onBlur={close}
          onChange={(e) => {
            setTyped(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        <Icon name="chevronDown" />
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
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
        >
          {error}
        </p>
      )}
      <div className={styles.chips}>
        {chips.map((meat) => (
          <Chip
            key={meat.id}
            onClick={() => onChange(meat.id)}
          >
            {meat.name}
          </Chip>
        ))}
        <Chip onClick={startNew}>+ New meat</Chip>
      </div>
    </div>
  );
};

export default MeatPicker;
