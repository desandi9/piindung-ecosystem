'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import Link from 'next/link';
import { Ambulance, ArrowRight, BatteryMedium, Bell, BookOpenText, ChevronRight, Clock3, CreditCard, HeartHandshake, History, ImageIcon, QrCode, Search, Signal, Wifi, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PublicArticle } from '@/lib/article-content';
import type { ImpactStory } from '@/lib/impact-content';
import { useAuth } from '@/lib/auth-context';
import { isAbortedRequest, runActorRequest, subscribeActorSession } from '@/services/api/actor-session';
import { munfiqProgramFixture, programArticles, programImpactStories, programKindLabel, type MunfiqProgramContent } from '@/features/gorut-v2/munfiq-program-content';
import { MobileActorAccessUnavailable } from '../mobile-shared/mobile-actor-access-unavailable';
import { MunfiqBottomNavigation } from './munfiq-bottom-navigation';
import { munfiqFont } from './munfiq-font';
import './munfiq-stitch.css';
import './munfiq-program.css';

type Selection = { title: string; description: string; item?: MunfiqProgramContent };
type Filter = 'all' | MunfiqProgramContent['kind'];
const filters: Array<{ key: Filter; label: string }> = [{ key: 'all', label: 'Semua' }, { key: 'artikel', label: 'Artikel' }, { key: 'berita', label: 'Berita' }, { key: 'dampak', label: 'Dampak' }];
const dateLabel = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(value)) : 'Tanggal belum tersedia';

function ProgramImage({ item, priority = false }: { item: MunfiqProgramContent; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return item.image && !failed ? <Image src={item.image} alt={item.id.includes('DEMO_FIXTURE') ? `Foto ilustrasi ${item.title}` : item.title} fill sizes="(max-width: 480px) 100vw, 480px" priority={priority} onError={() => setFailed(true)} /> : <span className="mqp-image-fallback"><ImageIcon size={26} aria-hidden="true" /><small>Gambar belum tersedia</small></span>;
}

function PublicationBody({ body }: { body: string }) {
  return body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => {
    if (/^#{1,3} /.test(paragraph)) return <h3 key={index}>{paragraph.replace(/^#{1,3} /, '')}</h3>;
    if (paragraph.split('\n').every((line) => line.startsWith('- '))) return <ul key={index}>{paragraph.split('\n').map((line, i) => <li key={i}>{line.slice(2)}</li>)}</ul>;
    if (paragraph.startsWith('> ')) return <blockquote key={index}>{paragraph.slice(2)}</blockquote>;
    return <p key={index}>{paragraph}</p>;
  });
}

function CampaignSummary({ item }: { item: MunfiqProgramContent }) {
  const campaign = item.demoCampaign;
  return campaign ? <div className="mqp-campaign">
    <div><strong>{campaign.collected} <small>terkumpul</small></strong><b>{campaign.percent}%</b></div>
    <progress value={campaign.percent} max={100} aria-label="Contoh progres penghimpunan" />
    <div><span>Target {campaign.target}</span><span>{campaign.participants ? `${campaign.participants} Munfiq` : 'Contoh penghimpunan'}</span></div>
  </div> : <div className="mqp-publication-meta"><span>{programKindLabel[item.kind]} · {dateLabel(item.publishedAt)}</span><strong>{item.author}</strong></div>;
}

export function MunfiqProgramScreen({ owner, homeHref = '/gorut-v2/mobile/munfiq', initialContent, initialFilter = 'all' }: {
  owner: { userId: string; munfiqCode: string; name: string };
  homeHref?: string;
  initialContent?: string;
  initialFilter?: Filter;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const authorized = !authLoading && user?.id === owner.userId;
  const [contents, setContents] = useState<MunfiqProgramContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const contentOpened = useRef<string | null>(null);
  const list = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!authorized) return;
    const request = new AbortController();
    setLoading(true);
    setErrors([]);
    setContents([]);
    setDemoMode(false);
    setSelection(null);
    const unsubscribe = subscribeActorSession(() => {
      request.abort(); setContents([]); setSelection(null); setDemoMode(false); setLoading(false);
      setErrors(['Sesi berubah. Muat ulang untuk melanjutkan.']);
    });
    void runActorRequest(async (signal) => {
      const results = await Promise.allSettled([
        fetch('/api/articles', { cache: 'no-store', signal }).then(async (response) => {
          if (!response.ok) throw new Error('Berita dan artikel belum dapat dimuat.');
          const value = await response.json() as { articles: PublicArticle[] };
          return programArticles(value.articles);
        }),
        fetch('/api/impact-content', { cache: 'no-store', signal }).then(async (response) => {
          if (!response.ok) throw new Error('Cerita dampak belum dapat dimuat.');
          const value = await response.json() as { content: { stories: Partial<ImpactStory>[] } };
          return programImpactStories(value.content.stories);
        }),
      ]);
      const items = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
      const failures = results.flatMap((result) => result.status === 'rejected' ? [result.reason instanceof Error ? result.reason.message : 'Konten belum dapat dimuat.'] : []);
      return { items, failures };
    }, request.signal).then(({ items, failures }) => {
      const fixture = !items.length && !failures.length ? munfiqProgramFixture(process.env.NODE_ENV, owner.munfiqCode) : null;
      setContents(fixture ?? items);
      setDemoMode(Boolean(fixture));
      setErrors(failures);
    }).catch((cause: unknown) => {
      if (!isAbortedRequest(cause)) setErrors(['Konten belum dapat dimuat. Silakan coba lagi.']);
    }).finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => { request.abort(); unsubscribe(); };
  }, [authorized, owner.munfiqCode, attempt]);

  useEffect(() => {
    if (!initialContent || contentOpened.current === initialContent || loading || !authorized) return;
    const item = contents.find((entry) => entry.id === initialContent);
    // A failed source may contain the requested item; allow retry before declaring it missing.
    if (!item && errors.length) return;
    contentOpened.current = initialContent;
    setSelection(item ? { title: item.title, description: item.excerpt, item } : { title: 'Konten belum tersedia', description: 'Publikasi ini belum tersedia. Silakan jelajahi konten lain yang telah dipublikasikan.' });
  }, [initialContent, loading, authorized, contents, errors.length]);

  const open = (item: Selection) => { opener.current = document.activeElement as HTMLElement; setSelection(item); };
  const openContent = (item: MunfiqProgramContent) => open({ title: item.title, description: item.excerpt, item });
  const explore = () => {
    setFilter('all'); setQuery(''); setShowAll(true);
    list.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  const needle = query.trim().toLocaleLowerCase('id-ID');
  const filtered = contents.filter((item) => (filter === 'all' || filter === item.kind) && (!needle || `${item.title} ${item.excerpt} ${item.topic ?? ''}`.toLocaleLowerCase('id-ID').includes(needle)));
  const featured = contents.find((item) => item.featured && item.kind !== 'dampak') ?? contents[0];
  const story = contents.find((item) => item.kind === 'dampak');
  const rows = showAll ? filtered : filtered.slice(0, 3);
  const initials = owner.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  if (!authLoading && !authorized) return <MobileActorAccessUnavailable actorType="MUNFIQ" reason="forbidden" />;

  return <div className={`mq-shell munfiq-mobile-surface mqp-shell ${munfiqFont.variable}`} data-presentation-data={demoMode ? 'DEMO_FIXTURE' : undefined}>
    <a className="mq-skip-link" href="#mqp-main">Lewati ke konten</a>
    <header className="mqp-header">
      <div className="mqp-status" aria-hidden="true"><strong>9:41</strong><span><Signal size={15} /><Wifi size={15} /><BatteryMedium size={17} /></span></div>
      <div className="mqp-toolbar"><Link href={homeHref} aria-label="Beranda Munfiq" className="mqp-brand"><Image src="/LOGO%20GORUT.png" alt="GORUT" width={84} height={36} priority /><span>MUNFIQ</span></Link><div><Link className="mqp-header-button" href={`${homeHref}/notifikasi`} aria-label="Notifikasi"><Bell size={19} /></Link><Link className="mqp-avatar" href={`${homeHref}/akun`} aria-label="Akun Munfiq">{initials}</Link></div></div>
      <h1 id="mqp-title" tabIndex={-1}>Program</h1><p>Temukan program kebaikan dan layanan yang dapat Anda ikuti.</p>
    </header>

    <main id="mqp-main" className="mqp-main" aria-labelledby="mqp-title" aria-busy={loading || authLoading}>
      {demoMode ? <p className="mqp-demo">Contoh tampilan · Angka program dan foto bersifat ilustrasi.</p> : null}
      {errors.length ? <div className="mq-error" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}<button type="button" onClick={() => setAttempt((value) => value + 1)}>Coba lagi</button></div> : null}
      {loading || authLoading ? <div className="mqp-loading" role="status"><span className="sr-only">Memuat program dan cerita…</span><i /><i /><i /></div> : featured ? <section className="mqp-hero" aria-label="Program unggulan">
        <div className="mqp-hero-image"><ProgramImage key={featured.id} item={featured} priority /></div>
        <div className="mqp-hero-content"><div className="mqp-hero-top"><span>{featured.topic ?? programKindLabel[featured.kind]}</span><small><Clock3 size={13} />{featured.featured ? 'Unggulan' : 'Terbaru'}</small></div><h2>{featured.title}</h2><p>{featured.excerpt}</p><CampaignSummary item={featured} /><button className="mqp-primary" type="button" onClick={() => openContent(featured)}>Lihat {demoMode ? 'program' : 'selengkapnya'}<ArrowRight size={17} /></button></div>
      </section> : !errors.length ? <section className="mqp-empty"><BookOpenText size={30} /><h2>Belum ada publikasi</h2><p>Program, berita, artikel, dan cerita dampak akan tampil setelah dipublikasikan.</p></section> : null}

      <section aria-labelledby="mqp-services-title"><div className="mqp-section-head"><h2 id="mqp-services-title">Layanan Cepat <small>Munfiq</small></h2><span>Akses Mandiri</span></div><div className="mqp-services">
        <button type="button" onClick={() => open({ title: 'PPOB Munfiq', description: 'Layanan pembayaran PPOB belum tersedia di aplikasi mobile. Informasinya akan ditampilkan setelah layanan tersedia.' })}><span><CreditCard size={22} /></span>PPOB</button>
        <Link href={`${homeHref}/barcode?from=program`}><span><QrCode size={22} /></span>Barcode</Link>
        <button type="button" onClick={() => open({ title: 'Layanan Ambulance', description: 'Permintaan layanan ambulance belum tersedia melalui halaman ini. Informasi layanan akan ditampilkan setelah tersedia.' })}><span><Ambulance size={22} /></span>Ambulance</button>
        <Link href={`${homeHref}/penjemputan`}><span><History size={22} /></span>Riwayat</Link>
      </div></section>

      <section ref={list} className="mqp-explore" aria-labelledby="mqp-explore-title"><div className="mqp-section-head"><h2 id="mqp-explore-title">Jelajahi Program</h2><span>Konten PIINDUNG</span></div>
        <div className="mqp-filters" aria-label="Filter konten">{filters.map(({ key, label }) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => { setFilter(key); setShowAll(false); }}>{label}</button>)}</div>
        <div className="mqp-search" role="search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Cari program, berita, atau cerita" placeholder="Cari program, berita, atau cerita…" value={query} onChange={(event) => { setQuery(event.target.value); setShowAll(false); }} /></div>
        <div className="mqp-section-head mqp-list-head"><h2>{filter === 'all' ? 'Program & Kabar Terbaru' : filter === 'dampak' ? 'Cerita Dampak' : `${programKindLabel[filter]} Terbaru`}</h2><button type="button" onClick={explore}>Lihat semua <ArrowRight size={13} /></button></div>
        <div className="mqp-list" aria-live="polite">{loading ? <p className="mqp-result-note">Memuat publikasi…</p> : rows.length ? rows.map((item) => <button type="button" className="mqp-card" key={item.id} onClick={() => openContent(item)} aria-label={`Baca ${item.title}`}><span className="mqp-card-image"><ProgramImage item={item} /><small>{programKindLabel[item.kind]}</small></span><span className="mqp-card-content"><span className="mqp-card-topic">{item.topic ?? programKindLabel[item.kind]}</span><strong>{item.title}</strong><span className="mqp-card-excerpt">{item.excerpt}</span><span className="mqp-card-footer"><small>{item.demoCampaign?.collected ?? dateLabel(item.publishedAt)}</small><b>Lihat detail<ChevronRight size={13} /></b></span></span></button>) : <div className="mqp-empty mqp-filter-empty"><Search size={25} /><h3>{query || filter !== 'all' ? 'Tidak ada konten yang cocok' : errors.length ? 'Konten belum dapat dimuat' : 'Belum ada konten'}</h3><p>{query || filter !== 'all' ? 'Coba kata kunci lain atau tampilkan semua konten.' : 'Publikasi terbaru akan tampil di sini.'}</p>{query || filter !== 'all' ? <button type="button" onClick={explore}>Tampilkan semua</button> : null}</div>}</div>
        {!showAll && filtered.length > 3 ? <button type="button" className="mqp-more" onClick={() => setShowAll(true)}>Muat lebih banyak <ChevronRight size={15} /></button> : null}
      </section>

      <section aria-labelledby="mqp-joined-title"><div className="mqp-section-head"><h2 id="mqp-joined-title">Program yang Saya Ikuti</h2></div><div className="mqp-joined"><HeartHandshake size={25} /><div><h3>Belum ada catatan keikutsertaan</h3><p>Kontribusi untuk program tertentu belum tersedia di sini.</p></div><Link href={`${homeHref}/penjemputan`}>Lihat riwayat koin<ChevronRight size={15} /></Link></div></section>

      <section aria-labelledby="mqp-impact-title"><div className="mqp-section-head"><h2 id="mqp-impact-title">Cerita Dampak</h2><span>Kabar Kebaikan</span></div>{story ? <article className="mqp-impact"><h3><HeartHandshake size={22} />{story.title}</h3><p>{story.excerpt}</p><footer><span>{story.location || story.author}</span><button type="button" onClick={() => openContent(story)}>Baca cerita <ArrowRight size={14} /></button></footer></article> : <div className="mqp-impact"><p>{loading ? 'Memuat cerita dampak…' : 'Cerita dampak akan tampil setelah dipublikasikan di PIINDUNG.'}</p></div>}</section>
      <section className="mqp-cta"><h2>Ada program yang ingin Anda kenali?</h2><p>Temukan kabar kebaikan GORUT yang sesuai dengan kepedulian Anda untuk Garut.</p><button type="button" className="mqp-primary" onClick={explore}>Jelajahi semua program</button></section>
    </main>

    <MunfiqBottomNavigation activeKey="program" homeHref={homeHref} />
    <Dialog.Root open={Boolean(selection) && authorized} onOpenChange={(open) => { if (!open) setSelection(null); }}><Dialog.Portal><Dialog.Overlay className="mqp-overlay" /><Dialog.Content className={`mqp-sheet ${munfiqFont.variable}`} onCloseAutoFocus={(event) => { event.preventDefault(); (opener.current?.isConnected ? opener.current : document.getElementById('mqp-title'))?.focus(); }}><span className="mqp-sheet-handle" aria-hidden="true" /><div className="mqp-sheet-header"><div>{selection?.item ? <span>{selection.item.topic ?? programKindLabel[selection.item.kind]}</span> : null}<Dialog.Title>{selection?.title}</Dialog.Title></div><Dialog.Close aria-label="Tutup detail"><X size={20} /></Dialog.Close></div><Dialog.Description>{selection?.description}</Dialog.Description>{selection?.item ? <><div className="mqp-sheet-image"><ProgramImage key={selection.item.id} item={selection.item} /></div>{demoMode ? <p className="mqp-demo">Contoh tampilan · Foto ilustrasi dan angka contoh.</p> : null}<div className="mqp-sheet-meta">{dateLabel(selection.item.publishedAt)} · {selection.item.author}</div><div className="mqp-body"><PublicationBody body={selection.item.body || selection.item.excerpt} /></div>{selection.item.demoCampaign ? <CampaignSummary item={selection.item} /> : null}</> : null}<Dialog.Close className="mqp-primary">Selesai</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
