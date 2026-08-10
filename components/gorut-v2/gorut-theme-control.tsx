'use client';

import { Check, Laptop, Moon, Sun } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GORUT_THEME_OPTIONS,
  type GorutThemeMode,
} from '@/features/gorut-v2/theme';

import { useGorutTheme } from './gorut-theme-provider';


function ThemeIcon({ mode }: { mode: GorutThemeMode }) {
  if (mode === 'light') return <Sun size={16} aria-hidden="true" />;
  if (mode === 'dark') return <Moon size={16} aria-hidden="true" />;
  return <Laptop size={16} aria-hidden="true" />;
}

export function GorutThemeControl({ compact = false }: { compact?: boolean }) {
  const { mode: selected, resolvedTheme, setMode } = useGorutTheme();
  const selectedLabel = GORUT_THEME_OPTIONS.find((option) => option.id === selected)?.label ?? 'Sistem';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="gorut-theme-trigger"
          aria-label={`Pilih tema tampilan. Tema aktif: ${selectedLabel}`}
        >
          <ThemeIcon mode={selected} />
          {compact ? null : <span>{selectedLabel}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={`gorut-theme-menu gorut-theme-${resolvedTheme}`}>
        <DropdownMenuRadioGroup value={selected} onValueChange={(value) => setMode(value as GorutThemeMode)}>
          {GORUT_THEME_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id} className="gorut-theme-option">
              <ThemeIcon mode={option.id} />
              <span className="gorut-theme-option-copy">
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
              {selected === option.id ? <Check className="gorut-theme-option-check" aria-hidden="true" /> : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
