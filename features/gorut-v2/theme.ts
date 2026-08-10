export type GorutThemeMode = 'light' | 'dark' | 'system';

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
