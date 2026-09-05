'use client';

import { Bell } from 'lucide-react';

export function MobileOperationalLoadingShell({
  initials,
  name,
  assignmentLabel,
  contextLabel,
}: {
  initials: string;
  name: string;
  assignmentLabel: string;
  contextLabel?: string;
}) {
  return (
    <div className="plpk-scroll plpk-home-screen" aria-busy="true">
      <header className="plpk-home-header">
        <div className="plpk-home-avatar" aria-hidden="true">{initials}</div>
        <div className="plpk-home-greeting">
          <span>Assalamu’alaikum</span>
          <strong>{name}</strong>
          <small>{assignmentLabel}{contextLabel ? ` · ${contextLabel}` : ''}</small>
        </div>
        <button type="button" className="plpk-icon-button plpk-notification-button" aria-label="Notifikasi sedang disiapkan" disabled>
          <Bell size={21} aria-hidden="true" />
        </button>
      </header>

      <section className="plpk-period-hero" aria-label="Periode aktif sedang dimuat">
        <div className="plpk-period-top">
          <div>
            <span>Periode aktif</span>
            <div className="mt-2 h-7 w-36 rounded-lg bg-white/25" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-5 h-3 w-full rounded-full bg-white/20" aria-hidden="true" />
        <p className="plpk-period-note" role="status">Menyiapkan data operasional…</p>
      </section>

      <section className="plpk-home-section" aria-label="Ringkasan sedang dimuat">
        <div className="h-5 w-36 rounded-md bg-[#e5ece8]" aria-hidden="true" />
        <div className="mt-4 h-24 rounded-2xl bg-[#f0f4f2]" aria-hidden="true" />
        <div className="mt-3 grid grid-cols-3 gap-3" aria-hidden="true">
          <div className="h-20 rounded-2xl bg-[#f0f4f2]" />
          <div className="h-20 rounded-2xl bg-[#f0f4f2]" />
          <div className="h-20 rounded-2xl bg-[#f0f4f2]" />
        </div>
      </section>
    </div>
  );
}
