import { useState } from 'react';
import type { Toast } from '@/components/UndoToast/UndoToast';

/**
 * Rating from a detail screen: saves at once and offers an Undo toast. `save` writes the record;
 * wire `toast`, `undo` and `close` to an UndoToast.
 */
export const useRating = (current: number | null, save: (rating: number | null) => void) => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [previous, setPrevious] = useState<number | null>(null);

  return {
    toast,
    rate: (rating: number | null) => {
      setPrevious(current);
      save(rating);
      setToast({ id: crypto.randomUUID(), message: 'Rating saved' });
    },
    undo: () => {
      save(previous);
      setToast(null);
    },
    close: () => setToast(null),
  };
};
