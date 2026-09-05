'use client';

import { BellOff, Check, Monitor, Moon, Palette, ShieldCheck, Sun, UserRound } from 'lucide-react';

import { GorutAppShell } from '@/components/gorut-v2/gorut-app-shell';
import { OperationPageHeader } from '@/components/gorut-v2/operations/operation-page-header';
import { useGorutTheme } from '@/components/gorut-v2/gorut-theme-provider';
import { GORUT_THEME_OPTIONS, type GorutThemeMode } from '@/features/gorut-v2/theme';
import { roleDisplayNames, useAuth } from '@/lib/auth-context';

const themeIcons: Record<GorutThemeMode, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };

export function SettingsShell() {
  const { mode, resolvedTheme, setMode } = useGorutTheme();
  const { user, isLoading } = useAuth();

  return (
    <GorutAppShell title="Pengaturan">
      <div className="gorut-munfiq-workspace gorut-admin-workspace gorut-settings-workspace">
        <OperationPageHeader
          eyebrow="Preferensi"
          title="Pengaturan GORUT"
          description="Preferensi frontend yang aman dan tidak mengubah workflow, akses, formula, atau konfigurasi keuangan."
          meta={<span className="gorut-admin-source-pill"><ShieldCheck size={14} aria-hidden="true" />Lokal · langsung diterapkan</span>}
        />

        <section className="gorut-settings-grid" aria-label="Pengaturan frontend GORUT">
          <article className="gorut-settings-card is-profile">
            <header><span><UserRound size={18} aria-hidden="true" /></span><div><h2>Profil Ringkas</h2><p>Informasi sesi aktif. Data tidak dapat diubah dari halaman ini.</p></div></header>
            {isLoading ? <div className="gorut-settings-profile-loading" aria-label="Memuat profil" /> : (
              <dl className="gorut-settings-profile">
                <div><dt>Nama</dt><dd>{user?.name || 'Pengguna GORUT'}</dd></div>
                <div><dt>Peran</dt><dd>{user ? roleDisplayNames[user.role] : 'Sesi tidak tersedia'}</dd></div>
                <div><dt>Email</dt><dd>{user?.email || '—'}</dd></div>
                <div><dt>Lingkup</dt><dd>NU Care–LAZISNU Garut</dd></div>
              </dl>
            )}
          </article>

          <article className="gorut-settings-card is-appearance">
            <header><span><Palette size={18} aria-hidden="true" /></span><div><h2>Tampilan</h2><p>Pilih tema GORUT. Preferensi disimpan pada perangkat ini.</p></div></header>
            <div className="gorut-theme-choice-grid" role="radiogroup" aria-label="Tema tampilan">
              {GORUT_THEME_OPTIONS.map((option) => {
                const Icon = themeIcons[option.id];
                const active = mode === option.id;
                return <button key={option.id} type="button" role="radio" aria-checked={active} className={active ? 'is-active' : ''} onClick={() => setMode(option.id)}><span className="gorut-theme-choice-icon"><Icon size={18} aria-hidden="true" /></span><span><strong>{option.label}</strong><small>{option.description}</small></span>{active ? <Check className="gorut-theme-choice-check" size={16} aria-hidden="true" /> : null}</button>;
              })}
            </div>
            <p className="gorut-settings-current-theme"><Check size={14} aria-hidden="true" />Tema aktif saat ini: <strong>{resolvedTheme === 'dark' ? 'Gelap' : 'Terang'}</strong></p>
          </article>

          <article className="gorut-settings-card is-guardrail">
            <header><span><BellOff size={18} aria-hidden="true" /></span><div><h2>Notifikasi</h2><p>Preferensi notifikasi operasional belum memiliki source frontend yang aman.</p></div></header>
            <div className="gorut-settings-locked"><ShieldCheck size={20} aria-hidden="true" /><div><strong>Tidak diaktifkan pada scaffold</strong><p>Tidak ada toggle semu. Pengaturan akan tersedia setelah source notifikasi resmi terhubung.</p></div></div>
          </article>

          <article className="gorut-settings-card is-guardrail">
            <header><span><ShieldCheck size={18} aria-hidden="true" /></span><div><h2>Batas Aman</h2><p>Konfigurasi sensitif tetap berada di luar halaman frontend ini.</p></div></header>
            <ul className="gorut-settings-guardrail-list">
              <li>Formula dan bisyaroh PLPK tidak diubah</li>
              <li>Workflow, status bisnis, dan hak akses tidak diubah</li>
              <li>Konfigurasi keuangan dan gateway tidak ditampilkan</li>
              <li>Profil hanya dibaca dari sesi yang sudah ada</li>
            </ul>
          </article>
        </section>
      </div>
    </GorutAppShell>
  );
}
