'use client';

import Image from 'next/image';
import { ArrowUpRight, Bell } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './home.css';

export function HomeHeader({ role, name, assignment, initials, unreadCount = 0, onNotifications }: {
  role: string; name: string; assignment: string; initials: string;
  unreadCount?: number; onNotifications?: () => void;
}) {
  return <header className="gh-header">
    <div className="gh-masthead"><span className="gh-wordmark"><Image src="/gorut-logo-icon.png" alt="" width={30} height={32} /><strong>GORUT</strong></span><span className="gh-role">{role}</span></div>
    <div className="gh-greeting"><div><p>Assalamu’alaikum,</p><h1>{name}</h1><span>{assignment}</span></div>{onNotifications ? <button type="button" className="gh-avatar" onClick={onNotifications} aria-label={`Buka notifikasi, ${unreadCount} belum dibaca`}><Bell size={21} strokeWidth={1.7} />{unreadCount > 0 ? <i /> : null}</button> : <span className="gh-avatar" aria-hidden="true">{initials}</span>}</div>
  </header>;
}

/** Financial text stays exact. Only its visual entrance is animated. */
export function HomeValue({ children }: { children: string }) {
  return <span className="gh-value" key={children}>{children}</span>;
}

/** Count animation is limited to non-financial integer statistics. */
export function HomeCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(0);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || document.documentElement.dataset.animations === 'off') { previous.current = value; setDisplay(value); return; }
    const from = previous.current;
    previous.current = value;
    const start = performance.now();
    let frame = 0;
    function tick(now: number) {
      const progress = Math.min((now - start) / 240, 1);
      setDisplay(Math.round(from + (value - from) * (1 - (1 - progress) ** 4)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    const stop = () => { if (preference.matches) { cancelAnimationFrame(frame); setDisplay(value); } };
    preference.addEventListener('change', stop);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener('change', stop); };
  }, [value]);
  return <><span className="sr-only">{value.toLocaleString('id-ID')}</span><span aria-hidden="true">{display.toLocaleString('id-ID')}</span></>;
}

export function HomeHero({ eyebrow, label, value, note, children }: { eyebrow: string; label: string; value: ReactNode; note: string; children?: ReactNode }) {
  return <section className="gh-hero" aria-label={label}>
    <div className="gh-hero-top"><span>{eyebrow}</span><ArrowUpRight size={19} strokeWidth={1.5} aria-hidden="true" /></div>
    <p className="gh-hero-label">{label}</p><div className="gh-hero-value">{value}</div><p className="gh-hero-note">{note}</p>{children}
  </section>;
}

export function HomeSection({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="gh-section"><div className="gh-section-heading"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action}</div>{children}</section>;
}

export function HomeStat({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return <article className="gh-stat"><span className="gh-stat-icon" aria-hidden="true">{icon}</span><strong>{typeof value === 'number' ? <HomeCount value={value} /> : value}</strong><span>{label}</span></article>;
}

export function HomeProgress({ value, label, detail }: { value: number; label: string; detail: string }) {
  return <div className="gh-progress"><div><span>{label}</span><strong>{detail}</strong></div><div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }} /></div></div>;
}

export function HomeSkeleton() {
  return <div className="gh-home gh-loading" role="status" aria-label="Memuat beranda" aria-busy="true"><span className="sr-only">Memuat beranda…</span><div className="gh-skeleton gh-skeleton-heading" /><div className="gh-skeleton gh-skeleton-hero" /><div className="gh-stats">{[0, 1, 2].map((item) => <div key={item} className="gh-skeleton gh-skeleton-stat" style={{ '--gh-delay': `${item * 40}ms` } as CSSProperties} />)}</div><div className="gh-skeleton gh-skeleton-panel" /></div>;
}
