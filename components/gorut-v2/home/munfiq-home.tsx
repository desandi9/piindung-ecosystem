'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  Ambulance,
  Bookmark,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Heart,
  History,
  ImageIcon,
  Info,
  QrCode,
  UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './munfiq-home-stitch.css';

type HomeNotification = {
  id: string;
  title: string;
  createdAt: string;
  publishedAt: string | null;
  read: boolean;
};

export type MunfiqHomeProgram = {
  id: string;
  title: string;
  excerpt: string;
  contentType: 'artikel' | 'berita';
  coverImage: string;
  featured: boolean;
  publishedAt: string | null;
  category?: string;
  targetLabel?: string;
};

export type MunfiqHomeStory = {
  id: string;
  title: string;
  excerpt: string;
  featured: boolean;
};

const noop = () => undefined;

function notificationTime(value: string) {
  if (!Number.isFinite(Date.parse(value))) return 'Waktu belum tersedia';
  return `${new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value)).replace(':', '.')} WIB`;
}

function programDate(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Tanggal belum tersedia';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

function parseRupiah(value: string) {
  if (!/^Rp\d[\d.]*?(?:,\d{2})?$/.test(value)) return null;
  const parsed = Number(value.slice(2).replaceAll('.', '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function animatedRupiah(value: number) {
  return `Rp${Math.floor(value).toLocaleString('id-ID')}`;
}

function AnimatedTotal({ value, replay }: { value: string; replay: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const target = parseRupiah(value);
    if (target === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    setDisplay('Rp0');
    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / 1100, 1);
      const eased = progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
      setDisplay(progress === 1 ? value : animatedRupiah(target * eased));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [replay, value]);

  return <strong>{display}</strong>;
}

function DeviceStatus() {
  return <aside className="gmh-status" aria-label="Status perangkat"><strong>9:41</strong><span>
    <svg viewBox="0 0 18 14" aria-hidden="true"><path d="M1 10.5h2.5v3H1v-3zm4.5-3H8v6H5.5v-6zm4.5-3h2.5v9H10v-9zm4.5-3H17v12h-2.5v-12z" /></svg>
    <svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 2.5c2.4 0 4.6.9 6.2 2.5l1.4-1.4C13.8 1.8 11 1 8 1 5 1 2.2 1.8.4 3.6L1.8 5C3.4 3.4 5.6 2.5 8 2.5zm0 3.5c1.4 0 2.8.6 3.8 1.6l1.4-1.4C11.8 4.8 10 4 8 4c-2 0-3.8.8-5.2 2.2l1.4 1.4C5.2 6.6 6.6 6 8 6zm0 3.5c.8 0 1.5.3 2 .8l-2 2-2-2c.5-.5 1.2-.8 2-.8z" /></svg>
    <i><b /></i>
  </span></aside>;
}

export function MunfiqHome({
  name,
  code,
  initials,
  total,
  collectionCount,
  unreadCount,
  loading,
  notificationsReady = false,
  latestNotifications = [],
  programs = [],
  programsReady = true,
  impactStory = null,
  impactReady = true,
  onCollections,
  onNotifications,
  onProgram = noop,
  onProfile = noop,
  barcodeHref = '/gorut-v2/mobile/munfiq/barcode',
  programHref = '/gorut-v2/mobile/munfiq/program',
  children,
}: {
  name: string;
  code: string;
  initials: string;
  total: string;
  collectionCount: number | null;
  unreadCount: number;
  loading: boolean;
  notificationsReady?: boolean;
  latestNotifications?: HomeNotification[];
  programs?: MunfiqHomeProgram[];
  programsReady?: boolean;
  impactStory?: MunfiqHomeStory | null;
  impactReady?: boolean;
  onCollections: () => void;
  onNotifications: () => void;
  onProgram?: () => void;
  onProfile?: () => void;
  barcodeHref?: string;
  programHref?: string;
  onLogout?: () => void;
  children: ReactNode;
}) {
  const [unavailable, setUnavailable] = useState('');
  const [replay, setReplay] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setUnavailable(message);
    toastTimer.current = setTimeout(() => setUnavailable(''), 2200);
  };

  const replayAnimation = () => {
    setReplay((value) => value + 1);
    showToast('Memuat ulang animasi...');
  };

  return <div className="gmh-home" data-munfiq-code={code}>
    <DeviceStatus />
    <div key={replay} className="gmh-animated-content">
      <header className="gmh-topbar gmh-enter" style={{ '--gmh-delay': '40ms' } as CSSProperties}>
        <div className="gmh-brand">
          <button type="button" className="gmh-logo-button" onClick={replayAnimation} aria-label="Putar ulang animasi Home"><Image src="/LOGO GORUT.png" alt="GORUT" width={92} height={39} priority /></button>
          <span><i />MUNFIQ</span>
        </div>
        <button type="button" className="gmh-icon-button gmh-touch" onClick={onNotifications} aria-label={`Buka notifikasi, ${unreadCount} belum dibaca`}><Bell size={16} strokeWidth={1.8} />{unreadCount > 0 ? <i className="gmh-unread-dot" /> : null}</button>
      </header>

      <main className="gmh-main">
        <section className="gmh-greeting gmh-enter" style={{ '--gmh-delay': '80ms' } as CSSProperties}>
          <div><p>Assalamu’alaikum,</p><h1>{name}</h1><span>Terima kasih telah menjadi bagian dari gerakan kebaikan untuk Garut.</span></div>
          <button type="button" className="gmh-avatar gmh-touch" onClick={onProfile} aria-label="Buka profil Munfiq"><span>{initials}</span><i /></button>
        </section>

        <section className="gmh-hero gmh-enter" style={{ '--gmh-delay': '140ms' } as CSSProperties} aria-label="Ringkasan infak tercatat">
          <div className="gmh-hero-glow" aria-hidden="true" />
          <svg className="gmh-radar" fill="none" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" stroke="white" strokeDasharray="8 6" strokeWidth="5" /><path d="M50 18 L50 82 M18 50 L82 50" stroke="white" strokeWidth="3" /><circle cx="50" cy="50" r="16" stroke="white" strokeDasharray="4 4" strokeWidth="2" /></svg>
          <div className="gmh-hero-eyebrow"><i /><span>● PERJALANAN KEBAIKAN ANDA</span><CheckCircle2 size={14} fill="currentColor" strokeWidth={1.5} /></div>
          <div className="gmh-hero-value"><small>Total infak tercatat</small><div>{loading ? <span className="gmh-value-skeleton" aria-label="Memuat nominal" /> : <AnimatedTotal value={total} replay={replay} />}<button type="button" className="gmh-hero-detail gmh-touch" onClick={onCollections} aria-label="Buka detail infak"><ChevronRight size={17} strokeWidth={2.5} /></button></div></div>
          <div className="gmh-hero-divider" />
          <div className="gmh-hero-footer"><span><Box size={14} strokeWidth={1.8} />{loading ? 'Memuat riwayat…' : collectionCount === null ? 'Riwayat belum tersedia' : `${collectionCount.toLocaleString('id-ID')} kali kontribusi tercatat`}</span><small>Diperbarui hari ini</small></div>
        </section>

        <section className="gmh-actions" aria-label="Menu Layanan">
          <ActionButton label="Riwayat Penjemputan" icon={<History size={20} strokeWidth={1.8} />} delay="180ms" onClick={onCollections} />
          <ActionButton label="PPOB" icon={<CreditCard size={20} strokeWidth={1.8} />} delay="210ms" onClick={() => showToast('PPOB belum tersedia — Coming Soon.')} />
          <ActionLink label="Barcode Saya" icon={<QrCode size={20} strokeWidth={1.8} />} delay="240ms" href={barcodeHref} />
          <ActionButton label="Program" icon={<Bookmark size={20} strokeWidth={1.8} />} delay="270ms" onClick={onProgram} />
          <ActionButton label="Donasi Saya" icon={<Heart size={20} strokeWidth={1.8} />} delay="300ms" onClick={onCollections} />
          <ActionButton label="Layanan Ambulance" icon={<Ambulance size={20} strokeWidth={1.8} />} delay="330ms" onClick={() => showToast('Layanan Ambulance belum tersedia — Coming Soon.')} />
          <ActionButton label="Notifikasi" icon={<Bell size={20} strokeWidth={1.8} />} delay="360ms" onClick={onNotifications} dot={unreadCount > 0} />
          <ActionButton label="Profil" icon={<UserRound size={20} strokeWidth={1.8} />} delay="390ms" onClick={onProfile} />
        </section>

        <section className="gmh-section gmh-enter" style={{ '--gmh-delay': '430ms' } as CSSProperties} aria-labelledby="gmh-history-title">
          <div className="gmh-section-head"><h2 id="gmh-history-title">Riwayat Penjemputan</h2><button type="button" onClick={onCollections}>Lihat semua <span aria-hidden="true">→</span></button></div>
          <p className="gmh-section-note"><i />Nominal muncul setelah dicatat oleh PLPK.</p>
          <div className="gmh-history-list">{children}</div>
        </section>

        <section className="gmh-story-section gmh-enter" style={{ '--gmh-delay': '480ms' } as CSSProperties} aria-labelledby="gmh-story-title">
          <div className="gmh-section-head"><h2 id="gmh-story-title">Cerita dari Lapangan</h2></div>
          <article className="gmh-story-card">
            <span>★ CERITA DARI LAPANGAN</span>
            {!impactReady ? <div className="gmh-story-loading"><i /><i /></div> : impactStory ? <><h3>{impactStory.title}</h3><p>{impactStory.excerpt}</p></> : <div className="gmh-inline-empty"><strong>Belum ada cerita yang dipublikasikan</strong><p>Konten akan tampil di area ini setelah tersedia.</p></div>}
            <Link href={impactStory ? `${programHref}?content=${encodeURIComponent(`impact:${impactStory.id}`)}` : `${programHref}?filter=dampak`} prefetch={false}>Lihat cerita dampak lengkap <span aria-hidden="true">→</span></Link>
          </article>
        </section>

        <section className="gmh-program-section gmh-enter" style={{ '--gmh-delay': '520ms' } as CSSProperties} aria-labelledby="gmh-program-title">
          <div className="gmh-section-head"><h2 id="gmh-program-title">Program untuk Anda</h2><button type="button" onClick={onProgram}>Lihat semua <span aria-hidden="true">→</span></button></div>
          <div className="gmh-program-list">
            {!programsReady ? <><ProgramSkeleton /><ProgramSkeleton /></> : programs.length ? programs.slice(0, 2).map((program) => <ProgramCard program={program} key={program.id} programHref={programHref} />) : <ProgramEmpty />}
          </div>
        </section>

        <section className="gmh-section gmh-enter" style={{ '--gmh-delay': '560ms' } as CSSProperties} aria-labelledby="gmh-notifications-title">
          <div className="gmh-section-head"><h2 id="gmh-notifications-title">Notifikasi terbaru</h2><button type="button" onClick={onNotifications}>Lihat semua <span aria-hidden="true">→</span></button></div>
          {loading ? <div className="gmh-mini-loading" aria-label="Memuat notifikasi"><i /><i /></div>
            : latestNotifications.length ? <div className="gmh-notification-list">{latestNotifications.slice(0, 3).map((item) => <button type="button" onClick={onNotifications} key={item.id} className={item.read ? undefined : 'is-unread'}><NotificationMark title={item.title} /><div><strong>{item.title}</strong><time dateTime={item.publishedAt ?? item.createdAt}>{notificationTime(item.publishedAt ?? item.createdAt)}</time></div></button>)}</div>
            : notificationsReady ? <div className="gmh-notification-empty"><span><Bell size={16} /></span><div><strong>Belum ada notifikasi</strong><small>Pembaruan akun akan tampil di sini.</small></div></div> : null}
        </section>
      </main>
    </div>

    <div className={unavailable ? 'gmh-toast is-visible' : 'gmh-toast'} role="status" aria-live="polite"><i />{unavailable}</div>
  </div>;
}

function ActionButton({ label, icon, delay, badge, dot, onClick }: { label: string; icon: ReactNode; delay: string; badge?: string; dot?: boolean; onClick: () => void }) {
  return <button type="button" className="gmh-action gmh-touch gmh-enter" style={{ '--gmh-delay': delay } as CSSProperties} onClick={onClick}><div className="gmh-action-icon">{icon}{dot ? <i /> : null}</div><span className="gmh-action-label">{label}</span>{badge ? <small>{badge}</small> : null}</button>;
}

function ActionLink({ label, icon, delay, href }: { label: string; icon: ReactNode; delay: string; href: string }) {
  return <Link className="gmh-action gmh-touch gmh-enter" style={{ '--gmh-delay': delay } as CSSProperties} href={href} prefetch={false}><div className="gmh-action-icon">{icon}</div><span className="gmh-action-label">{label}</span></Link>;
}

function ProgramCard({ program, programHref }: { program: MunfiqHomeProgram; programHref: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <article className="gmh-program-card"><Link href={`${programHref}?content=${encodeURIComponent(`article:${program.id}`)}`} prefetch={false}>
    <div className="gmh-program-image">{program.coverImage && !imageFailed ? <Image src={program.coverImage} alt={`Gambar ${program.title}`} fill sizes="350px" onError={() => setImageFailed(true)} /> : <span><ImageIcon size={28} /><small>Gambar belum tersedia</small></span>}<b>{program.category ?? (program.contentType === 'berita' ? 'Berita' : 'Artikel')}</b></div>
    <div className="gmh-program-body"><h3>{program.title}</h3><p>{program.excerpt}</p><footer><span>{program.targetLabel ?? `Terbit: ${programDate(program.publishedAt)}`}</span><strong>Lihat detail <ChevronRight size={14} /></strong></footer></div>
  </Link></article>;
}

function NotificationMark({ title }: { title: string }) {
  if (/program/i.test(title)) return <span className="is-info"><Info size={16} strokeWidth={2.5} /></span>;
  if (/jemput/i.test(title)) return <span className="is-pickup"><Clock3 size={16} strokeWidth={2.2} /></span>;
  return <span><Check size={16} strokeWidth={2.5} /></span>;
}

function ProgramEmpty() {
  return <article className="gmh-program-card is-empty"><div className="gmh-program-image"><span><ImageIcon size={28} /><small>Belum ada gambar</small></span></div><div className="gmh-program-body"><h3>Belum ada program yang dipublikasikan</h3><p>Konten program akan tampil di kartu ini setelah tersedia.</p></div></article>;
}

function ProgramSkeleton() {
  return <div className="gmh-program-skeleton" aria-label="Memuat program"><i /><span /><span /></div>;
}
