'use client';

import { CalendarDays, Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isAbortedRequest, runActorRequest, subscribeActorSession } from '@/services/api/actor-session';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { recordedOwnAmount } from '@/features/gorut-v2/munfiq-presentation';
import { munfiqHomePresentationData } from '@/features/gorut-v2/munfiq-home-presentation-data';

import { MunfiqHome, type MunfiqHomeProgram, type MunfiqHomeStory } from '../home/munfiq-home';
import { HomeSkeleton } from '../home/home-ui';
import { MunfiqBottomNavigation } from './munfiq-bottom-navigation';

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
type TabKey = 'home' | 'collections' | 'program' | 'notifications' | 'account';

type ArticlesResponse = { articles: MunfiqHomeProgram[] };
type ImpactResponse = { content?: { stories?: MunfiqHomeStory[] } };

function date(value: string, withTime = false) {
  return new Intl.DateTimeFormat('id-ID', withTime
    ? { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }
    : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

function initials(name: string) {
  return (name.match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M';
}

function period(value: string) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value));
}

function recordedTotal(collections: Collection[]) {
  let totalMinor = 0;
  let found = false;
  for (const item of collections) {
    if (!recordedOwnAmount(item)) continue;
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(item.amount);
    if (!match) continue;
    const minor = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
    if (!Number.isSafeInteger(minor) || !Number.isSafeInteger(totalMinor + minor)) return 'Nominal tidak tersedia';
    found = true;
    totalMinor += minor;
  }
  if (!found) return 'Belum ada nominal tercatat';
  const whole = Math.floor(totalMinor / 100);
  const cents = totalMinor % 100;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${grouped}${cents === 0 ? '' : `,${cents.toString().padStart(2, '0')}`}`;
}

function recordedCount(collections: Collection[]) {
  return collections.reduce((total, item) => total + (recordedOwnAmount(item) ? 1 : 0), 0);
}

function LoadingCards() {
  return <div className="munfiq-skeleton-list" aria-label="Memuat data infak"><span /><span /><span /></div>;
}

function CollectionCard({ item, onOpen }: { item: Collection; onOpen?: () => void }) {
  const amount = recordedOwnAmount(item);
  const pending = amount === null;
  const content = <>
      <span className={pending ? 'munfiq-collection-icon is-pending' : 'munfiq-collection-icon'}>{pending ? <CalendarDays size={20} /> : <Check size={20} strokeWidth={1.8} />}</span>
      <span className="munfiq-collection-copy"><strong>{`Penjemputan ${period(item.periodStart)}`}</strong><span>{pending ? `Waktu belum tersedia · PLPK: ${item.historicalPlpk.name}` : `${date(item.statusAt ?? item.periodStart)} · Dicatat PLPK ${item.historicalPlpk.name}`}</span></span>
      <span className={pending ? 'munfiq-collection-fact is-pending' : 'munfiq-collection-fact'}>{amount ? <strong>{amount}</strong> : null}<small>{pending ? 'Menunggu Penjemputan' : (item.status ?? 'Sudah Dijemput')}</small></span>
    </>;
  return onOpen
    ? <button type="button" className="munfiq-collection-card" onClick={onOpen}>{content}</button>
    : <article className="munfiq-collection-card" data-presentation-data="DEMO_FIXTURE">{content}</article>;
}

export function MunfiqMobileApp({ identity, collectionPath = '/gorut-v2/mobile/munfiq/penjemputan' }: {
  identity: { munfiqCode: string; name: string };
  collectionPath?: string;
}) {
  const router = useRouter();
  const homeHref = collectionPath.replace(/\/penjemputan$/, '');
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<CollectionsResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationsResponse | null>(null);
  const [programs, setPrograms] = useState<MunfiqHomeProgram[] | null>(null);
  const [impactStory, setImpactStory] = useState<MunfiqHomeStory | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requests = useRef(new AbortController());

  const load = useCallback(async () => {
    // An explicit retry gets a fresh signal after request cancellation.
    if (requests.current.signal.aborted) requests.current = new AbortController();
    setLoading(true);
    setError('');
    try {
      const [collectionsData, notificationsData] = await runActorRequest(async (signal) => {
        const collectionsResponse = await fetch('/api/gorut/munfiq/me/collections', { cache: 'no-store', signal });
        if (!collectionsResponse.ok) throw new Error('Data belum dapat dimuat.');
        const collectionsData = await collectionsResponse.json() as CollectionsResponse;
        if (collectionsData.owner.munfiqCode !== identity.munfiqCode) throw new Error('Identitas akun berubah. Muat ulang halaman.');
        const notificationsResponse = await fetch('/api/notifications/me?page=1&limit=20', { cache: 'no-store', signal });
        if (!notificationsResponse.ok) throw new Error('Notifikasi belum dapat dimuat.');
        const notificationsData = await notificationsResponse.json() as NotificationsResponse;
        return [collectionsData, notificationsData] as const;
      }, requests.current.signal);
      setData(collectionsData);
      setNotifications(notificationsData);
    } catch (cause) {
      if (isAbortedRequest(cause)) return;
      setError(cause instanceof Error ? cause.message : 'Terjadi kendala saat memuat data.');
    } finally {
      setLoading(false);
    }
  }, [identity.munfiqCode]);

  const loadHomeContent = useCallback(async (signal: AbortSignal) => {
    const [articlesResult, impactResult] = await Promise.allSettled([
      fetch('/api/articles', { cache: 'no-store', signal }).then(async (response) => {
        if (!response.ok) throw new Error('Program belum dapat dimuat.');
        return response.json() as Promise<ArticlesResponse>;
      }),
      fetch('/api/impact-content', { cache: 'no-store', signal }).then(async (response) => {
        if (!response.ok) throw new Error('Cerita dampak belum dapat dimuat.');
        return response.json() as Promise<ImpactResponse>;
      }),
    ]);
    if (signal.aborted) return;
    setPrograms(articlesResult.status === 'fulfilled' ? articlesResult.value.articles : []);
    if (impactResult.status === 'fulfilled') {
      const stories = impactResult.value.content?.stories ?? [];
      setImpactStory(stories.find((story) => story.featured) ?? stories[0] ?? null);
    } else {
      setImpactStory(null);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    requests.current = new AbortController();
    const unsubscribe = subscribeActorSession(() => {
      requests.current.abort();
      setData(null);
      setNotifications(null);
      setPrograms(null);
      setImpactStory(undefined);
      setError('');
    });
    void load();
    void loadHomeContent(requests.current.signal);
    return () => { requests.current.abort(); unsubscribe(); };
  }, [load, loadHomeContent, authLoading, user]);

  const openDetail = useCallback((collectionCode: string) => {
    router.push(`${collectionPath}?collection=${encodeURIComponent(collectionCode)}`);
  }, [collectionPath, router]);

  const selectTab = useCallback((next: TabKey) => {
    if (next === 'collections') { router.push(collectionPath); return; }
    if (next === 'program') { router.push(`${homeHref}/program`); return; }
    if (next === 'notifications') { router.push(`${homeHref}/notifikasi`); return; }
    if (next === 'account') { router.push(`${homeHref}/akun`); return; }
    router.push(homeHref);
  }, [collectionPath, homeHref, router]);

  const presentationData = munfiqHomePresentationData(process.env.NODE_ENV, identity.munfiqCode);
  const homeData = presentationData?.collections ?? data;
  const homeNotifications = presentationData?.notifications ?? notifications;
  const homePrograms = presentationData?.programs ?? programs ?? [];
  const homeStory = presentationData?.story ?? impactStory ?? null;
  const displayName = presentationData?.name ?? data?.owner.name ?? identity.name;

  if (authLoading || !user) return <main className="munfiq-app gh-frame"><HomeSkeleton /></main>;

  return (
    <main className="munfiq-app gh-munfiq-app munfiq-mobile-surface" data-presentation-data={presentationData?.marker}>
      <section className="munfiq-scroll gh-munfiq-content" aria-live="polite" data-home-tab="home">
        {error && !presentationData ? <div className="munfiq-error" role="alert"><p>{error}</p><button type="button" onClick={() => void load()}>Coba lagi</button></div> : null}

        <MunfiqHome name={displayName} code={identity.munfiqCode} initials={initials(displayName)} barcodeHref={`${homeHref}/barcode`} programHref={`${homeHref}/program`} total={homeData ? recordedTotal(homeData.collections) : 'Tidak tersedia'} collectionCount={homeData ? recordedCount(homeData.collections) : null} unreadCount={homeNotifications?.unreadCount ?? 0} loading={presentationData ? false : loading} notificationsReady={Boolean(homeNotifications)} latestNotifications={homeNotifications?.notifications ?? []} programs={homePrograms} programsReady={presentationData ? true : programs !== null} impactStory={homeStory} impactReady={presentationData ? true : impactStory !== undefined} onCollections={() => selectTab('collections')} onNotifications={() => selectTab('notifications')} onProgram={() => selectTab('program')} onProfile={() => selectTab('account')}>
          {presentationData ? presentationData.collections.collections.slice(0, 3).map((item) => <CollectionCard key={item.collectionCode} item={item} />) : loading ? <LoadingCards /> : data?.collections.length ? data.collections.slice(0, 2).map((item) => <CollectionCard key={item.collectionCode} item={item} onOpen={() => void openDetail(item.collectionCode)} />) : data && !error ? <div className="munfiq-empty"><strong>Belum ada riwayat</strong><p>Catatan infak Anda akan muncul di sini setelah tersedia.</p></div> : null}
        </MunfiqHome>
      </section>
      <MunfiqBottomNavigation activeKey="home" homeHref={homeHref} pickupsHref={collectionPath} onNavigate={(key) => selectTab(key === 'pickups' ? 'collections' : key)} />
    </main>
  );
}
