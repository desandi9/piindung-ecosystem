'use client';

import { HandCoinsIcon, Home01Icon, Notification02Icon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useCallback, useEffect, useState } from 'react';

import { MobileServiceIcon } from '@/components/gorut-v2/plpk-mobile/mobile-service-icon';

type TimelineItem = { key: string; label: string; at: string };
type Collection = {
  collectionCode: string;
  periodStart: string;
  amount: string;
  currency: 'IDR';
  status: string | null;
  statusAt: string | null;
  historicalPlpk: { code: string; name: string };
  location: { ranting: string; kecamatan: string };
  timeline: TimelineItem[];
};
type CollectionsResponse = {
  owner: { munfiqCode: string; name: string };
  summary: { collectionCount: number; totalAmount: string; currency: 'IDR' };
  collections: Collection[];
};
type Notification = { id: string; title: string; body: string; createdAt: string; publishedAt: string | null; readAt: string | null; read: boolean };
type NotificationsResponse = { notifications: Notification[]; unreadCount: number };
type TabKey = 'home' | 'collections' | 'notifications';

const tabs: Array<{ key: TabKey; label: string; icon: IconSvgElement }> = [
  { key: 'home', label: 'Beranda', icon: Home01Icon },
  { key: 'collections', label: 'Infak Saya', icon: HandCoinsIcon },
  { key: 'notifications', label: 'Notifikasi', icon: Notification02Icon },
];

function money(value: string) {
  const [whole, fraction = '00'] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${grouped}${fraction === '00' ? '' : `,${fraction}`}`;
}

function date(value: string, withTime = false) {
  return new Intl.DateTimeFormat('id-ID', withTime
    ? { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }
    : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

function initials(name: string) {
  return (name.match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M';
}

function LoadingCards() {
  return <div className="munfiq-skeleton-list" aria-label="Memuat data infak"><span /><span /><span /></div>;
}

function CollectionCard({ item, onOpen }: { item: Collection; onOpen: () => void }) {
  return (
    <button type="button" className="munfiq-collection-card" onClick={onOpen}>
      <span className="munfiq-card-top"><strong>{money(item.amount)}</strong><span>{item.status ?? 'Riwayat tersedia'}</span></span>
      <span className="munfiq-card-period">Periode {date(item.periodStart)}</span>
      <span className="munfiq-card-meta">Dijemput oleh {item.historicalPlpk.name}</span>
      <span className="munfiq-card-link">Lihat riwayat <span aria-hidden="true">›</span></span>
    </button>
  );
}

export function MunfiqMobileApp({ identity }: { identity: { munfiqCode: string; name: string } }) {
  const [tab, setTab] = useState<TabKey>('home');
  const [data, setData] = useState<CollectionsResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationsResponse | null>(null);
  const [detail, setDetail] = useState<Collection | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const collectionsResponse = await fetch('/api/gorut/munfiq/me/collections', { cache: 'no-store' });
      if (!collectionsResponse.ok) throw new Error('Data belum dapat dimuat.');
      const collectionsData = await collectionsResponse.json() as CollectionsResponse;
      const notificationsResponse = await fetch('/api/notifications/me?page=1&limit=20', { cache: 'no-store' });
      if (!notificationsResponse.ok) throw new Error('Notifikasi belum dapat dimuat.');
      const notificationsData = await notificationsResponse.json() as NotificationsResponse;
      setData(collectionsData);
      setNotifications(notificationsData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Terjadi kendala saat memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openDetail = useCallback(async (collectionCode: string) => {
    setTab('collections');
    setDetailLoading(true);
    setDetail(null);
    try {
      const response = await fetch(`/api/gorut/munfiq/me/collections/${encodeURIComponent(collectionCode)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Riwayat tidak dapat dibuka.');
      const result = await response.json() as { collection: Collection };
      setDetail(result.collection);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Riwayat tidak dapat dibuka.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const selectTab = useCallback((next: TabKey) => {
    setTab(next);
    setDetail(null);
  }, []);

  const visibleNotifications = notifications?.notifications ?? [];
  const displayName = data?.owner.name ?? identity.name;

  return (
    <main className="munfiq-app">
      <header className="munfiq-header">
        <div className="munfiq-brand-mark" aria-hidden="true">NU</div>
        <div><strong>GORUT Munfiq</strong><span>Transparansi infak Anda</span></div>
        {notifications?.unreadCount ? <span className="munfiq-unread" aria-label={`${notifications.unreadCount} notifikasi belum dibaca`}>{notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}</span> : null}
      </header>

      <section className="munfiq-scroll" aria-live="polite">
        {error ? <div className="munfiq-error" role="alert"><p>{error}</p><button type="button" onClick={() => void load()}>Coba lagi</button></div> : null}

        {tab === 'home' ? (
          <>
            <section className="munfiq-welcome">
              <span className="munfiq-avatar">{initials(displayName)}</span>
              <div><small>Assalamu&apos;alaikum</small><h1>{displayName}</h1><p>{identity.munfiqCode}</p></div>
            </section>
            <section className="munfiq-summary" aria-label="Ringkasan infak">
              <div><span>Total infak tercatat</span>{loading || !data ? <i className="munfiq-line-skeleton" /> : <strong>{money(data.summary.totalAmount)}</strong>}</div>
              <div><span>Riwayat infak</span>{loading || !data ? <i className="munfiq-line-skeleton short" /> : <strong>{data.summary.collectionCount} kali</strong>}</div>
            </section>
            <div className="munfiq-section-heading"><h2>Infak terbaru</h2>{data?.collections.length ? <button type="button" onClick={() => selectTab('collections')}>Lihat semua</button> : null}</div>
            {loading ? <LoadingCards /> : data?.collections.length ? data.collections.slice(0, 2).map((item) => <CollectionCard key={item.collectionCode} item={item} onOpen={() => void openDetail(item.collectionCode)} />) : <div className="munfiq-empty"><strong>Belum ada riwayat</strong><p>Catatan infak Anda akan muncul di sini setelah tersedia.</p></div>}
          </>
        ) : null}

        {tab === 'collections' && !detail ? (
          <>
            <div className="munfiq-title"><h1>Infak Saya</h1><p>Nominal dan perjalanan infak milik Anda.</p></div>
            {detailLoading || loading ? <LoadingCards /> : data?.collections.length ? data.collections.map((item) => <CollectionCard key={item.collectionCode} item={item} onOpen={() => void openDetail(item.collectionCode)} />) : <div className="munfiq-empty"><strong>Belum ada riwayat</strong><p>Catatan infak Anda akan muncul di sini setelah tersedia.</p></div>}
          </>
        ) : null}

        {tab === 'collections' && detail ? (
          <>
            <button type="button" className="munfiq-back" onClick={() => setDetail(null)}><span aria-hidden="true">‹</span> Infak Saya</button>
            <section className="munfiq-detail-card">
              <small>Nominal infak Anda</small><h1>{money(detail.amount)}</h1><p>{detail.status}</p>
              <dl><div><dt>Periode</dt><dd>{date(detail.periodStart)}</dd></div><div><dt>Petugas PLPK</dt><dd>{detail.historicalPlpk.name}</dd></div><div><dt>Wilayah</dt><dd>{detail.location.ranting}, {detail.location.kecamatan}</dd></div><div><dt>Kode riwayat</dt><dd>{detail.collectionCode}</dd></div></dl>
            </section>
            <div className="munfiq-section-heading"><h2>Perjalanan infak</h2></div>
            {detail.timeline.length ? <ol className="munfiq-timeline">{detail.timeline.map((item, index) => <li key={`${item.key}-${item.at}`} className={index === detail.timeline.length - 1 ? 'is-current' : undefined}><span /><div><strong>{item.label}</strong><time dateTime={item.at}>{date(item.at, true)} WIB</time></div></li>)}</ol> : <div className="munfiq-empty"><strong>Riwayat belum lengkap</strong><p>Kami hanya menampilkan waktu yang benar-benar sudah tercatat.</p></div>}
            <p className="munfiq-factual-note">Setiap tahap ditampilkan dari waktu pencatatan yang tersedia di sistem.</p>
          </>
        ) : null}

        {tab === 'notifications' ? (
          <>
            <div className="munfiq-title"><h1>Notifikasi</h1><p>Pembaruan proses infak dan akun Anda.</p></div>
            {loading ? <LoadingCards /> : visibleNotifications.length ? <div className="munfiq-notification-list">{visibleNotifications.map((item) => <article key={item.id} className={!item.read ? 'is-unread' : undefined}><span className="munfiq-notification-icon"><MobileServiceIcon icon={Notification02Icon} label="Notifikasi" size={19} /></span><div><strong>{item.title}</strong><p>{item.body}</p><time dateTime={item.publishedAt ?? item.createdAt}>{date(item.publishedAt ?? item.createdAt, true)} WIB</time></div></article>)}</div> : <div className="munfiq-empty"><strong>Belum ada notifikasi</strong><p>Pembaruan penting akan tampil di sini.</p></div>}
          </>
        ) : null}
      </section>

      <nav className="munfiq-nav" aria-label="Menu utama Munfiq">{tabs.map((item) => <button key={item.key} type="button" className={tab === item.key ? 'is-active' : undefined} aria-current={tab === item.key ? 'page' : undefined} onClick={() => selectTab(item.key)}><span className="munfiq-nav-icon"><MobileServiceIcon icon={item.icon} label={item.label} size={22} />{item.key === 'notifications' && notifications?.unreadCount ? <i aria-hidden="true" /> : null}</span><span>{item.label}</span></button>)}</nav>
    </main>
  );
}
