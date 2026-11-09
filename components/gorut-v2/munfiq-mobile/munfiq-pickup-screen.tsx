'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Check, ChevronRight, Info, Truck, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { munfiqHomePresentationData } from '@/features/gorut-v2/munfiq-home-presentation-data';
import { useMobileLogout } from '@/features/gorut-v2/mobile-auth';
import { collectionFact, munfiqDate, recordedOwnAmount, type MunfiqCollection } from '@/features/gorut-v2/munfiq-presentation';
import { useMunfiqCollections } from '@/features/gorut-v2/use-munfiq-collections';
import { MobileActorAccessUnavailable } from '../mobile-shared/mobile-actor-access-unavailable';
import { MunfiqCollectionDetail } from './munfiq-collection-detail';
import { MunfiqHistoryRow, MunfiqJourney, MunfiqLoading, MunfiqRecordingNote, MunfiqStatus, munfiqJourneyStep } from './munfiq-history-primitives';
import { MunfiqPickupShell } from './munfiq-pickup-shell';
import { munfiqFont } from './munfiq-font';

const enter = (delay: string) => ({ '--mq-enter-delay': delay }) as CSSProperties;
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const villageLabel = (name: string) => name.replace(/^(Desa|Kelurahan)\s+/i, '');

function PickupEducationDialog() {
  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <button className="mq-pickup-education" type="button">
        <span><Info size={20} aria-hidden="true" /></span>
        <span><strong>Bagaimana penjemputan bekerja?</strong><small>Lihat alur Munfiq hingga pencatatan amanah.</small></span>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="mq-sheet-overlay mq-pickup-detail-overlay" />
      <Dialog.Content className={`mq-pickup-dialog ${munfiqFont.variable}`}>
        <Dialog.Title>Alur Penjemputan Koin</Dialog.Title>
        <Dialog.Description>Ikuti perjalanan infak Anda dari penjemputan hingga penghimpunan.</Dialog.Description>
        <Dialog.Close className="mq-icon-button mq-pickup-dialog-close" aria-label="Tutup penjelasan"><X size={17} aria-hidden="true" /></Dialog.Close>
        <ol>
          <li><span>1</span><div><strong>Munfiq Mengisi Kaleng</strong>Infak rutin disimpan di koin kaleng GORUT milik Munfiq.</div></li>
          <li><span>2</span><div><strong>PLPK Menjemput dan Mencatat</strong>Nominal riil baru tampil setelah PLPK mencatat penjemputan.</div></li>
          <li><span>3</span><div><strong>Verifikasi Kordes</strong>Status berubah mengikuti verifikasi yang tercatat di sistem.</div></li>
          <li><span>4</span><div><strong>Proses UPZIS dan PC</strong>Perjalanan infak diperbarui setelah proses berikutnya tercatat.</div></li>
        </ol>
        <Dialog.Close className="mq-primary-button mq-pickup-understood">Saya Mengerti</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

function PickupOfficer({ item }: { item: MunfiqCollection }) {
  const village = villageLabel(item.location.ranting);
  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <button className="mq-pickup-officer" type="button" aria-label={`Lihat profil petugas ${item.historicalPlpk.name}`}>
        <span>{initials(item.historicalPlpk.name)}<i aria-hidden="true"><Check size={8} strokeWidth={3} /></i></span>
        <div><strong>{item.historicalPlpk.name}<small>PLPK</small></strong><p>PLPK {village} · Wilayah {village}</p></div>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="mq-sheet-overlay mq-pickup-detail-overlay" />
      <Dialog.Content className={`mq-pickup-dialog mq-pickup-officer-dialog ${munfiqFont.variable}`}>
        <span className="mq-pickup-detail-eyebrow">Petugas GORUT</span>
        <Dialog.Close className="mq-icon-button mq-pickup-dialog-close" aria-label="Tutup profil petugas"><X size={17} aria-hidden="true" /></Dialog.Close>
        <span className="mq-pickup-officer-portrait" aria-hidden="true">{initials(item.historicalPlpk.name)}</span>
        <Dialog.Title>{item.historicalPlpk.name}</Dialog.Title>
        <Dialog.Description>ID: {item.historicalPlpk.code}</Dialog.Description>
        <dl><div><dt>Penugasan</dt><dd>PLPK {village}</dd></div><div><dt>Wilayah</dt><dd>{item.location.kecamatan}</dd></div></dl>
        <p>Informasi kontak petugas belum tersedia.</p>
        <Dialog.Close className="mq-primary-button">Tutup</Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function MunfiqPickupScreen({ owner, initialCollectionCode, navigation }: {
  owner: { userId: string; munfiqCode: string };
  initialCollectionCode?: string;
  navigation?: { homeHref: string; pickupsHref: string; accountHref: string };
}) {
  const history = useMunfiqCollections(owner);
  const fixture = munfiqHomePresentationData(process.env.NODE_ENV, owner.munfiqCode)?.collections ?? null;
  const presentationMode = history.authorized && !history.loading && !history.error && Boolean(fixture) && history.data?.collections.length === 0;
  const data = presentationMode ? fixture : history.data;
  const items = data?.collections ?? [];
  const current = items[0];
  const pastItems = current ? items.slice(1) : [];
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [presentationDetail, setPresentationDetail] = useState<MunfiqCollection | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const initialOpened = useRef(false);
  const { logout, logoutPending } = useMobileLogout('MUNFIQ', setLogoutError);
  const { authorized, openDetail } = history;

  useEffect(() => {
    if (!authorized || !initialCollectionCode || initialOpened.current || history.loading) return;
    initialOpened.current = true;
    setSelectedCode(initialCollectionCode);
    const fixtureItem = presentationMode ? fixture?.collections.find((item) => item.collectionCode === initialCollectionCode) : null;
    if (fixtureItem) setPresentationDetail(fixtureItem);
    else void openDetail(initialCollectionCode);
  }, [authorized, fixture, history.loading, initialCollectionCode, openDetail, presentationMode]);

  const open = (item: MunfiqCollection) => {
    document.querySelector('[data-mq-last-open]')?.removeAttribute('data-mq-last-open');
    document.activeElement?.setAttribute('data-mq-last-open', 'true');
    setSelectedCode(item.collectionCode);
    if (presentationMode) setPresentationDetail(item);
    else void history.openDetail(item.collectionCode);
  };
  const close = () => {
    setSelectedCode(null);
    setPresentationDetail(null);
    history.closeDetail();
  };

  if (!history.authLoading && !history.authorized) return <MobileActorAccessUnavailable actorType="MUNFIQ" reason="forbidden" />;

  const recorded = current ? collectionFact(current, 'recorded') : undefined;
  const pending = current ? Boolean(collectionFact(current, 'pending')) : false;
  const journeyStep = current ? munfiqJourneyStep(current) : 1;
  const rows = showAll ? pastItems : pastItems.slice(0, 3);
  const effectiveError = logoutError || (presentationMode ? '' : history.error);
  const busy = history.authLoading || (history.loading && !presentationMode) || logoutPending;
  const ownAmount = current ? recordedOwnAmount(current) : null;
  const visibleFixtureDetail = presentationMode ? presentationDetail : null;

  return <MunfiqPickupShell onLogout={logout} busy={busy} navigation={navigation}>
    {logoutPending ? <p className="mq-session-status" role="status">Sedang keluar…</p> : history.authLoading || history.loading ? <MunfiqLoading /> : <>
      {effectiveError ? <div className="mq-error" role="alert"><p>{effectiveError}</p><button type="button" onClick={() => { setLogoutError(''); void history.load(); }}>Muat ulang riwayat</button></div> : null}
      {data && current ? <>
        <section className="mq-pickup-hero mq-pickup-enter" style={enter('150ms')} aria-label="Penjemputan terbaru">
          <div className="mq-hero-top"><span className="mq-period"><i aria-hidden="true" />{munfiqDate(current.periodStart, 'period')}</span><MunfiqStatus item={current} /></div>
          <dl className="mq-pickup-facts">
            <div><dt>{pending ? 'Tanggal' : 'Tanggal Dicatat'}</dt><dd>{recorded ? munfiqDate(recorded.at) : 'Belum tersedia'}</dd></div>
            {pending ? <div><dt>Waktu Penjemputan</dt><dd>Belum tersedia</dd></div> : ownAmount ? <div><dt>Nominal Infak Anda</dt><dd>{ownAmount}</dd></div> : null}
            <div><dt>Petugas PLPK</dt><dd>{current.historicalPlpk.name}</dd></div>
            <div><dt>Wilayah Tugas</dt><dd>PLPK {villageLabel(current.location.ranting)}</dd></div>
          </dl>
          {pending || !recorded ? <MunfiqRecordingNote /> : <p className="mq-note"><Info size={16} aria-hidden="true" /><span>Nominal sesuai pencatatan infak Anda oleh PLPK.</span></p>}
          <button type="button" className="mq-primary-button" onClick={() => open(current)}>Lihat rincian penjemputan<ChevronRight size={16} aria-hidden="true" /></button>
        </section>

        <section className="mq-pickup-enter" style={enter('225ms')} aria-labelledby="mq-journey-heading">
          <div className="mq-pickup-section-head"><h2 id="mq-journey-heading">Perjalanan saat ini</h2><span>Langkah {journeyStep} dari 4</span></div>
          <div className="mq-pickup-journey-card" style={{ '--mq-progress': String((journeyStep - 1) / 3) } as CSSProperties}><MunfiqJourney item={current} /></div>
        </section>

        <section className="mq-pickup-enter" style={enter('300ms')} aria-labelledby="mq-officer-heading">
          <div className="mq-pickup-section-head"><h2 id="mq-officer-heading">Petugas Anda</h2></div>
          <PickupOfficer item={current} />
        </section>

        <section className="mq-pickup-enter" style={enter('375ms')} aria-labelledby="mq-history-heading">
          <div className="mq-pickup-section-head"><h2 id="mq-history-heading">Riwayat Penjemputan</h2>{pastItems.length > 3 ? <button type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>{showAll ? 'Ringkas' : 'Lihat semua'}</button> : null}</div>
          <div className="mq-pickup-history">{rows.length ? rows.map((item) => <MunfiqHistoryRow key={item.collectionCode} item={item} onOpen={() => open(item)} />) : <p className="mq-pickup-history-empty">Belum ada arsip penjemputan sebelumnya.</p>}</div>
        </section>
      </> : data && !effectiveError ? <section className="mq-empty mq-surface"><Truck size={32} aria-hidden="true" /><h2>Belum ada riwayat penjemputan</h2><p>Catatan penjemputan Anda akan muncul setelah tersedia di sistem.</p><MunfiqRecordingNote /></section> : null}

      <section className="mq-pickup-enter" style={enter('450ms')} aria-label="Penjelasan alur penjemputan"><PickupEducationDialog /></section>
    </>}

    <MunfiqCollectionDetail open={Boolean(selectedCode) && history.authorized && !logoutPending} onClose={close} item={visibleFixtureDetail ?? history.detail} loading={visibleFixtureDetail ? false : history.detailLoading} error={visibleFixtureDetail ? '' : history.detailError} onRetry={() => { if (selectedCode) void history.openDetail(selectedCode); }} />
    {presentationMode ? <span className="sr-only" data-presentation-data="DEMO_FIXTURE">Data presentasi lokal aktif.</span> : null}
  </MunfiqPickupShell>;
}
