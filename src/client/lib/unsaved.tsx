//////////////////////////////////////
// Unsaved changes
// Forms report whether they are dirty; the shell's Close button asks before discarding.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type UnsavedValue = { dirty: boolean; setDirty: (dirty: boolean) => void };

const UnsavedContext = createContext<UnsavedValue | null>(null);

export const UnsavedProvider = ({ children }: { children: ReactNode }) => {
  const [dirty, setDirty] = useState(false);
  const value = useMemo(() => ({ dirty, setDirty }), [dirty]);
  return <UnsavedContext value={value}>{children}</UnsavedContext>;
};

export const useUnsavedState = () => {
  const ctx = useContext(UnsavedContext);
  if (!ctx) throw new Error('useUnsavedState must be used inside UnsavedProvider');
  return ctx;
};

/** Call from a form with its dirty flag; resets when the form unmounts. */
export const useUnsaved = (dirty: boolean) => {
  const { setDirty } = useUnsavedState();
  useEffect(() => {
    setDirty(dirty);
    return () => setDirty(false);
  }, [dirty, setDirty]);
};
