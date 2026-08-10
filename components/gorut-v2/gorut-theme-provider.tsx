'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  GORUT_THEME_STORAGE_KEY,
  normalizeGorutTheme,
  resolveGorutTheme,
  type GorutResolvedTheme,
  type GorutThemeMode,
} from '@/features/gorut-v2/theme';

type GorutThemeContextValue = {
  mode: GorutThemeMode;
  resolvedTheme: GorutResolvedTheme;
  setMode: (mode: GorutThemeMode) => void;
};

const GorutThemeContext = createContext<GorutThemeContextValue | null>(null);

export function GorutThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<GorutThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<GorutResolvedTheme>('light');
  const resolvedTheme = resolveGorutTheme(mode, systemTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => setSystemTheme(media.matches ? 'dark' : 'light');
    const stored = normalizeGorutTheme(window.localStorage.getItem(GORUT_THEME_STORAGE_KEY) ?? undefined);

    setModeState(stored);
    syncSystemTheme();
    media.addEventListener('change', syncSystemTheme);
    return () => media.removeEventListener('change', syncSystemTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.gorutTheme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo<GorutThemeContextValue>(() => ({
    mode,
    resolvedTheme,
    setMode(nextMode) {
      setModeState(nextMode);
      window.localStorage.setItem(GORUT_THEME_STORAGE_KEY, nextMode);
    },
  }), [mode, resolvedTheme]);

  return <GorutThemeContext.Provider value={value}>{children}</GorutThemeContext.Provider>;
}

export function useGorutTheme() {
  const value = useContext(GorutThemeContext);
  if (!value) throw new Error('useGorutTheme must be used within GorutThemeProvider');
  return value;
}
