export type GorutThemeMode = 'light' | 'dark' | 'system';
export type GorutResolvedTheme = 'light' | 'dark';

export const GORUT_THEME_STORAGE_KEY = 'gorut-v2-theme';

export const GORUT_THEME_OPTIONS = [
  { id: 'light', label: 'Terang', description: 'Selalu gunakan tema terang' },
  { id: 'dark', label: 'Gelap', description: 'Selalu gunakan tema gelap' },
  { id: 'system', label: 'Sistem', description: 'Ikuti pengaturan perangkat' },
] as const satisfies ReadonlyArray<{
  id: GorutThemeMode;
  label: string;
  description: string;
}>;

export function normalizeGorutTheme(value: string | undefined): GorutThemeMode {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function resolveGorutTheme(
  mode: GorutThemeMode,
  systemTheme: string | undefined,
): GorutResolvedTheme {
  if (mode === 'light' || mode === 'dark') return mode;
  return systemTheme === 'dark' ? 'dark' : 'light';
}
