import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import Field from '@/components/Field/Field';
import Icon from '@/components/Icon/Icon';
import { rankValues } from '@/lib/values';
import styles from './SuggestField.module.scss';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** The registry's suggestions. */
  options: readonly string[];
  /** Values used before for this field, repeats included; the most used are listed first. */
  used?: readonly string[];
  className?: string;
};

// A text field that offers suggestions: ARIA 1.2 combobox with a listbox popup. Focus shows the
// whole list, typing filters it (substring, case-insensitive). The text is the value, so anything
// typed is kept; nothing is highlighted until you arrow or hover, so Enter never replaces it.
const SuggestField = ({ label, value, onChange, options, used = [], className }: Props) => {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const ranked = useMemo(() => rankValues(used, options), [used, options]);
  const shown = useMemo(() => {
    const key = value.trim().toLowerCase();
    return filtering && key ? ranked.filter((item) => item.toLowerCase().includes(key)) : ranked;
  }, [ranked, value, filtering]);

  const optionId = (index: number) => `${listId}-${index}`;

  useEffect(() => {
    if (active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const close = () => {
    setOpen(false);
    setFiltering(false);
    setActive(-1);
  };

  const choose = (index: number) => {
    const item = shown[index];
    if (item === undefined) return;
    onChange(item);
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
      setActive((index) => {
        const next = index + step;
        return next < 0 ? shown.length - 1 : next >= shown.length ? 0 : next;
      });
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };

  return (
    <div className={className ? `${styles.suggest} ${className}` : styles.suggest}>
      <Field
        label={label}
        value={value}
        role="combobox"
        aria-expanded={open && shown.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        action={<Icon name="chevronDown" />}
        onFocus={() => setOpen(true)}
        onBlur={close}
        onChange={(e) => {
          onChange(e.target.value);
          setFiltering(true);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && shown.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
        >
          {shown.map((item, index) => (
            <li
              key={item}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              // mousedown, not click: the input must keep focus or onBlur closes the list first
              onMouseDown={(e) => {
                e.preventDefault();
                choose(index);
              }}
              onMouseEnter={() => setActive(index)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SuggestField;
