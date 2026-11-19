import type { KeyboardEvent } from 'react';

// Arrow keys move through a radiogroup (and choose as they go); Home and End jump to the ends.
const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * Keyboard behavior for a `role="radiogroup"` of `role="radio"` buttons: one tab stop (the chosen
 * option, else the first), arrow keys that move focus and choose with wraparound, Home and End.
 * Spread `onKeyDown` on the group and call `tabIndex(value)` on each radio, in `values` order.
 */
export const useRovingRadio = (
  values: readonly string[],
  value: string,
  onChange: (value: string) => void,
) => {
  const stop = values.includes(value) ? value : values[0];

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const radios = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
    const current = radios.findIndex((radio) => radio === document.activeElement);
    if (current < 0) return;

    let next = current + (STEP[e.key] ?? 0);
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = values.length - 1;
    else if (!(e.key in STEP)) return;

    e.preventDefault();
    next = (next + values.length) % values.length;
    const chosen = values[next];
    if (chosen === undefined) return;
    onChange(chosen);
    radios[next]?.focus();
  };

  return { onKeyDown, tabIndex: (option: string) => (option === stop ? 0 : -1) };
};
