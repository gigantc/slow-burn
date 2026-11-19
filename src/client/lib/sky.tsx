//////////////////////////////////////
// Sky
// A screen that is only sometimes a sky screen (the live cook shares its route with the cook
// detail) asks for the phone sky with useSky(); the shell reads it.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type SkyValue = { sky: boolean; setSky: (sky: boolean) => void };

const SkyContext = createContext<SkyValue | null>(null);

export const SkyProvider = ({ children }: { children: ReactNode }) => {
  const [sky, setSky] = useState(false);
  const value = useMemo(() => ({ sky, setSky }), [sky]);
  return <SkyContext value={value}>{children}</SkyContext>;
};

export const useSkyState = () => {
  const ctx = useContext(SkyContext);
  if (!ctx) throw new Error('useSkyState must be used inside SkyProvider');
  return ctx.sky;
};

/** Call from a screen that wants the phone sky while it is mounted. */
export const useSky = () => {
  const ctx = useContext(SkyContext);
  if (!ctx) throw new Error('useSky must be used inside SkyProvider');
  const { setSky } = ctx;
  useEffect(() => {
    setSky(true);
    return () => setSky(false);
  }, [setSky]);
};
