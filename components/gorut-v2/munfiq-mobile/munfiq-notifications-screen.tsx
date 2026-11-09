'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BatteryMedium, Bell, CheckCheck, Info, LifeBuoy, ReceiptText, Signal, Sparkles, Truck, Wifi, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { isAbortedRequest, runActorRequest, subscribeActorSession } from '@/services/api/actor-session';
import { mergeNotifications, munfiqNotificationFixture, notificationActionHref, notificationDate, notificationTimeGroup, notificationTopic, notificationTopicLabels, type MunfiqNotification, type MunfiqNotificationsResponse, type NotificationTopic } from '@/features/gorut-v2/munfiq-notifications';
import { MobileActorAccessUnavailable } from '../mobile-shared/mobile-actor-access-unavailable';
import { MunfiqBottomNavigation } from './munfiq-bottom-navigation';
import { munfiqFont } from './munfiq-font';
import './munfiq-stitch.css';
import './munfiq-notifications.css';

const filters = ['semua', 'penjemputan', 'kontribusi', 'program', 'layanan'] as const;
const icons = { penjemputan: Truck, kontribusi: ReceiptText, program: Sparkles, layanan: LifeBuoy, informasi: Info };

export function MunfiqNotificationsScreen({ owner, homeHref = '/gorut-v2/mobile/munfiq' }: {
  owner: { userId: string; munfiqCode: string }; homeHref?: string;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const authorized = !authLoading && user?.id === owner.userId;
  const [data, setData] = useState<MunfiqNotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [failedPage, setFailedPage] = useState(1);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [demo, setDemo] = useState(false);
  const [filter, setFilter] = useState<'semua' | NotificationTopic>('semua');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const request = useRef(new AbortController());
  const busy = useRef(false);
  const opener = useRef<HTMLElement | null>(null);

  const load = useCallback(async (page = 1) => {
    if (busy.current || !authorized) return;
    if (request.current.signal.aborted) request.current = new AbortController();
    const signal = request.current.signal;
    busy.current = true; setLoading(true); setError('');
    try {
      const result = await runActorRequest(async (signal) => {
        const response = await fetch(`/api/notifications/me?page=${page}&limit=20`, { cache: 'no-store', signal });
        if (!response.ok) throw new Error('Notifikasi belum dapat dimuat. Silakan coba lagi.');
        return await response.json() as MunfiqNotificationsResponse;
      }, signal);
      const fixture = page === 1 && !result.notifications.length && !result.hasMore && result.unreadCount === 0
        ? munfiqNotificationFixture(process.env.NODE_ENV, owner.munfiqCode) : null;
      setDemo(Boolean(fixture));
      setData((previous) => fixture ?? { ...result, notifications: page > 1 ? mergeNotifications(previous?.notifications ?? [], result.notifications) : result.notifications });
      setNow(Date.now());
    } catch (cause) {
      if (!isAbortedRequest(cause)) {
        setFailedPage(page);
        setError(cause instanceof Error ? cause.message : 'Notifikasi belum dapat dimuat.');
      }
    } finally {
      if (!signal.aborted) { busy.current = false; setLoading(false); }
    }
  }, [authorized, owner.munfiqCode]);

  useEffect(() => {
    if (!authorized) return;
    request.current = new AbortController(); busy.current = false;
    setData(null); setDemo(false); setSelectedId(null); setActionError(''); setNotice(''); setWorking(false);
    const unsubscribe = subscribeActorSession(() => {
      request.current.abort(); busy.current = false;
      setData(null); setDemo(false); setSelectedId(null); setLoading(false); setWorking(false); setNotice(''); setActionError('');
      setError('Sesi berubah. Muat ulang untuk melihat notifikasi Anda.');
    });
    void load();
    return () => { request.current.abort(); unsubscribe(); };
  }, [authorized, load]);

  const markRead = async (item?: MunfiqNotification) => {
    if (!authorized || !data || busy.current || (item ? item.read : data.unreadCount === 0)) return;
    setActionError(''); setNotice('');
    if (demo) {
      setData((previous) => {
        if (!previous) return previous;
        const notifications = previous.notifications.map((entry) => !item || entry.id === item.id ? { ...entry, read: true, readAt: new Date().toISOString() } : entry);
        return { ...previous, notifications, unreadCount: notifications.filter((entry) => !entry.read).length };
      });
      setNotice('Contoh tampilan diperbarui.');
      return;
    }
    const signal = request.current.signal;
    busy.current = true; setWorking(true);
    let refresh = false;
    try {
      await runActorRequest(async (signal) => {
        const response = await fetch(item ? `/api/notifications/${encodeURIComponent(item.id)}/read` : '/api/notifications/read-all', { method: item ? 'PATCH' : 'POST', signal });
        if (!response.ok) throw new Error('Status baca belum tersimpan. Silakan coba lagi.');
      }, signal);
      if (item) {
        setData((previous) => previous ? { ...previous, unreadCount: Math.max(0, previous.unreadCount - 1), notifications: previous.notifications.map((entry) => entry.id === item.id ? { ...entry, read: true, readAt: new Date().toISOString() } : entry) } : previous);
        setNotice('Notifikasi ditandai dibaca.');
      } else {
        // The existing endpoint processes a bounded batch. Re-read its count instead of assuming zero.
        refresh = true;
        setNotice('Status baca diperbarui.');
      }
    } catch (cause) {
      if (!isAbortedRequest(cause)) setActionError(cause instanceof Error ? cause.message : 'Status baca belum tersimpan.');
    } finally {
      if (!signal.aborted) { busy.current = false; setWorking(false); if (refresh) void load(); }
    }
  };

  const selected = data?.notifications.find((item) => item.id === selectedId);
  const actionHref = notificationActionHref(selected?.actionPath, homeHref);
  const groups = new Map<string, MunfiqNotification[]>();
  for (const item of data?.notifications ?? []) {
    if (filter !== 'semua' && notificationTopic(item) !== filter) continue;
    const group = notificationTimeGroup(item, now);
    groups.set(group, [...(groups.get(group) ?? []), item]);
  }
  if (!authLoading && !authorized) return <MobileActorAccessUnavailable actorType="MUNFIQ" reason="forbidden" />;

  return <div className={`mq-shell munfiq-mobile-surface mqn-shell ${munfiqFont.variable}`} data-presentation-data={demo ? 'DEMO_FIXTURE' : undefined}>
    <a className="mq-skip-link" href="#mqn-main">Lewati ke notifikasi</a>
    <header className="mqn-header">
      <div className="mqn-status" aria-hidden="true"><strong>9:41</strong><span><Signal size={15} /><Wifi size={15} /><BatteryMedium size={17} /></span></div>
      <div className="mqn-toolbar"><Link href={homeHref} aria-label="Kembali ke Beranda"><ArrowLeft size={20} /></Link><button type="button" disabled={!data?.unreadCount || loading || working} onClick={() => void markRead()}><CheckCheck size={17} /><span>{working && !selected ? 'Menyimpan…' : data && !data.unreadCount ? 'Sudah dibaca' : 'Tandai dibaca'}</span></button></div>
      <div className="mqn-title"><h1 id="mqn-title" tabIndex={-1}>Notifikasi</h1>{data ? <span className={data.unreadCount ? '' : 'is-clear'} aria-label={`${data.unreadCount} notifikasi belum dibaca`}>{data.unreadCount} Baru</span> : null}</div>
      <p>Pantau pembaruan penjemputan, kontribusi, dan program Anda.</p>
    </header>
    <div className="mqn-filters" aria-label="Filter notifikasi">{filters.map((key) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{key === 'semua' ? 'Semua' : notificationTopicLabels[key]}{key === 'semua' && Boolean(data?.unreadCount) ? <span>{data!.unreadCount}</span> : null}</button>)}</div>
    <main id="mqn-main" className="mqn-main" aria-labelledby="mqn-title" aria-busy={loading || authLoading}>
      {demo ? <p className="mqn-demo">Contoh tampilan · Status baca hanya berlaku selama halaman ini dibuka.</p> : null}
      <div role="status" className="mqn-notice">{notice}</div>
      {error ? <div className="mqn-error" role="alert"><p>{error}</p><button type="button" disabled={loading || working} onClick={() => void load(failedPage)}>Coba lagi</button></div> : null}
      {actionError && !selected ? <div className="mqn-error" role="alert"><p>{actionError}</p><button type="button" disabled={working} onClick={() => void markRead()}>Coba tandai lagi</button></div> : null}
      {!data && (loading || authLoading) ? <div className="mqn-loading" role="status"><span className="sr-only">Memuat notifikasi…</span><i /><i /><i /></div> : groups.size ? [...groups].map(([group, items]) => <section className="mqn-group" key={group} aria-label={group}><h2><i />{group}</h2><div className="mqn-card">{items.map((item) => {
        const topic = notificationTopic(item); const Icon = icons[topic];
        return <button key={item.id} type="button" className={`mqn-row ${item.read ? '' : 'is-unread'}`} aria-label={`${item.title}${item.read ? '' : ', belum dibaca'}`} onClick={() => { opener.current = document.activeElement as HTMLElement; setSelectedId(item.id); setActionError(''); void markRead(item); }}>
          <span className={`mqn-icon is-${topic}`}><Icon size={20} aria-hidden="true" /></span><span className="mqn-copy"><span className="mqn-meta"><span>{notificationTopicLabels[topic]}</span><time dateTime={item.publishedAt ?? item.createdAt}>{notificationDate(item, true)}</time></span><strong>{item.title}</strong><span className="mqn-excerpt">{item.body}</span><span className="mqn-row-footer"><span>{notificationDate(item)}</span><b>Lihat detail <ArrowRight size={13} /></b></span></span>{!item.read ? <i className="mqn-unread" aria-hidden="true" /> : null}
        </button>;
      })}</div></section>) : data ? <section className="mqn-empty"><Bell size={28} /><h2>Belum ada notifikasi{filter === 'semua' ? '' : ' di kategori ini'}</h2><p>Pembaruan akan muncul saat ada aktivitas terbaru.</p>{filter !== 'semua' ? <button type="button" onClick={() => setFilter('semua')}>Tampilkan semua</button> : null}</section> : null}
      {data?.hasMore ? <button className="mqn-more" type="button" disabled={loading || working} onClick={() => void load(data.page + 1)}>{loading ? 'Memuat…' : 'Muat notifikasi lainnya'}</button> : null}
    </main>
    <MunfiqBottomNavigation activeKey="notifications" homeHref={homeHref} showNotificationDot={Boolean(data?.unreadCount)} />
    <Dialog.Root open={Boolean(selected) && authorized} onOpenChange={(open) => { if (!open) { setSelectedId(null); setActionError(''); } }}><Dialog.Portal><Dialog.Overlay className="mqn-overlay" /><Dialog.Content className={`mqn-sheet ${munfiqFont.variable}`} onCloseAutoFocus={(event) => { event.preventDefault(); (opener.current?.isConnected ? opener.current : document.getElementById('mqn-title'))?.focus(); }}>
      <div className="mqn-handle" /><div className="mqn-sheet-meta"><span>{selected ? notificationTopicLabels[notificationTopic(selected)] : 'Notifikasi'}</span><Dialog.Close aria-label="Tutup detail"><X size={20} /></Dialog.Close></div>
      <Dialog.Title>{selected?.title}</Dialog.Title><Dialog.Description>{selected?.body}</Dialog.Description><p className="mqn-sheet-date">{selected ? `${notificationDate(selected)} · ${notificationDate(selected, true)}` : ''}</p>
      {demo ? <p className="mqn-demo">Contoh notifikasi untuk pratinjau tampilan.</p> : null}
      {actionError ? <p className="mqn-error" role="alert">{actionError}</p> : null}
      {selected && !selected.read ? <button type="button" className="mqn-more" disabled={working || loading} onClick={() => void markRead(selected)}>{working ? 'Menyimpan status baca…' : 'Tandai dibaca'}</button> : null}
      {actionHref ? <Link className="mqn-more" href={actionHref}>Buka halaman terkait <ArrowRight size={15} /></Link> : null}
      <Dialog.Close className="mqn-primary">Saya mengerti</Dialog.Close>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
