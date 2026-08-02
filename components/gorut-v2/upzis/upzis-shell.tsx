'use client';

import { Building2, Download, Info, Rows3, Search, SearchX, UserRound } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatNumber } from '@/features/gorut-v2/formatters';
import { currentUpzisPeriod, gorutUpzisRecaps } from '@/features/gorut-v2/upzis-mock-data';
import { upzisKordesOptions } from '@/features/gorut-v2/upzis-options';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';

import { GorutSidebar } from '../gorut-sidebar';
import { MobileSidebar } from '../mobile-sidebar';
import { MobileBottomNav } from '../mobile-bottom-nav';
import { GorutHeader } from '../gorut-header';
import { PenghimpunanTabs } from '../penghimpunan-tabs';

import { UpzisSummary } from './upzis-summary';
import { UpzisFilterBar } from './upzis-filter-bar';
import { UpzisTable } from './upzis-table';
import { UpzisMobileList } from './upzis-mobile-list';
import { UpzisDetailDrawer } from './upzis-detail-drawer';
import { BeritaAcaraDialog } from './berita-acara-dialog';
import { UpzisSkeleton } from './upzis-skeleton';
import { filterUpzisRecaps, initialUpzisFilters, type UpzisFilters } from './upzis-view';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

export function UpzisShell() {
  const [loading, setLoading] = useState(true);
  const [recaps, setRecaps] = useState<UpzisVillageRecap[]>(gorutUpzisRecaps);
  const [filters, setFilters] = useState<UpzisFilters>(initialUpzisFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  const [detailRecap, setDetailRecap] = useState<UpzisVillageRecap | null>(null);
  const [minutesRecap, setMinutesRecap] = useState<UpzisVillageRecap | null>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);

  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const triggerNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const filtered = useMemo(() => {
    return filterUpzisRecaps(recaps, deferredFilters);
  }, [recaps, deferredFilters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const currentRecaps = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const resetFilters = () => { setFilters(initialUpzisFilters); setPage(1); };
  const openDetail = (recap: UpzisVillageRecap, trigger?: HTMLElement) => {
    detailTriggerRef.current = trigger ?? null;
    setDetailRecap(recap);
  };
  const closeDetail = () => {
    setDetailRecap(null);
    window.requestAnimationFrame(() => detailTriggerRef.current?.focus());
  };

  /** Buat Rekap hanya memindahkan status ke "Sudah Direkap" pada state lokal. */
  const createRecap = (recap: UpzisVillageRecap) => {
    const next: UpzisVillageRecap = { ...recap, status: 'recapped', recappedAt: new Date().toISOString().split('T')[0] };
    setRecaps((previous) => previous.map((item) => (item.id === recap.id ? next : item)));
    if (detailRecap?.id === recap.id) setDetailRecap(next);
    triggerNotice(`Rekap desa ${recap.village} berhasil dibuat`);
  };

  return (
    <div className="gorut-viewport">
      {loading ? (
        <div className="gorut-app">
          <GorutSidebar target={target} />
          <div className="gorut-workspace">
            <GorutHeader title="Penghimpunan" onMenuOpen={() => setMobileMenu(true)} />
            <main className="gorut-main"><UpzisSkeleton /></main>
          </div>
        </div>
      ) : (
        <div className="gorut-app">
          <GorutSidebar target={target} />

          <div className="gorut-workspace">
            <GorutHeader title="Penghimpunan" onMenuOpen={() => setMobileMenu(true)} />

            <main className="gorut-main gorut-collect-main">
              <PenghimpunanTabs />

              <section className="gorut-collect-heading" aria-label="Judul halaman">
                <div>
                  <p>PENGHIMPUNAN</p>
                  <h1>Verifikasi UPZIS</h1>
                  <span>Periksa kelengkapan rekap penghimpunan setiap ranting/desa sebelum diteruskan ke tingkat PC.</span>
                </div>
              </section>

              <UpzisFilterBar filters={filters} onChange={(next) => { setFilters(next); setPage(1); }} onReset={resetFilters} />

              <UpzisSummary recaps={recaps} period={filters.period === 'all' ? currentUpzisPeriod : filters.period} />

              <p className="gorut-collect-readonly-note upzis-verification-note">
                <Info size={14} aria-hidden="true" />
                Halaman ini digunakan untuk memeriksa kelengkapan hasil penghimpunan dari setiap ranting/desa sebelum rekap diteruskan ke tingkat PC.
              </p>

              <section className="pjm-panel gorut-collect-panel upzis-verification-panel">
                <header className="pjm-toolbar upzis-verification-toolbar">
                  <label className="pjm-search">
                    <Search size={16} aria-hidden="true" />
                    <input
                      type="search"
                      value={filters.query}
                      onChange={(event) => { setFilters((current) => ({ ...current, query: event.target.value })); setPage(1); }}
                      placeholder="Cari desa/ranting, Kordes, atau wilayah"
                      aria-label="Cari desa atau ranting, Kordes, atau wilayah"
                    />
                  </label>

                  <div className="pjm-toolbar-actions upzis-verification-toolbar-actions">
                    <label className="upzis-verification-kordes-filter">
                      <UserRound size={15} aria-hidden="true" />
                      <span>Kordes</span>
                      <select value={filters.kordes} onChange={(event) => { setFilters((current) => ({ ...current, kordes: event.target.value })); setPage(1); }}>
                        {upzisKordesOptions.map((option, index) => <option key={option} value={index === 0 ? 'all' : option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="pjm-page-size">
                      <Rows3 size={15} aria-hidden="true" />
                      <span>Tampilkan</span>
                      <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span>baris</span>
                    </label>
                    <button type="button" className="pjm-export" onClick={() => triggerNotice('Export: prototipe UI, belum tersedia')}>
                      <Download size={15} aria-hidden="true" />Export
                    </button>
                  </div>
                </header>

                {filtered.length === 0 ? (
                  <div className="gorut-collect-empty">
                    <SearchX size={28} />
                    <h2>Belum ada rekap yang cocok</h2>
                    <p>Ubah kata kunci atau reset filter untuk melihat data lainnya.</p>
                    <button type="button" className="gorut-button gorut-secondary-button" onClick={resetFilters}>Reset Filter</button>
                  </div>
                ) : (
                  <>
                    <UpzisTable
                      recaps={currentRecaps}
                      onDetail={openDetail}
                      onRecap={createRecap}
                      onMinutes={setMinutesRecap}
                    />

                    <UpzisMobileList
                      recaps={currentRecaps}
                      onDetail={openDetail}
                      onRecap={createRecap}
                      onMinutes={setMinutesRecap}
                    />

                    <footer className="gorut-collect-pagination">
                      <div className="gorut-pagination-info">
                        Menampilkan <strong>{(safePage - 1) * pageSize + 1}–{Math.min(filtered.length, safePage * pageSize)}</strong> dari <strong>{formatNumber(filtered.length)}</strong> desa
                      </div>
                      <div className="gorut-pagination-controls">
                        <div className="gorut-pagination-buttons">
                          <button type="button" disabled={safePage === 1} onClick={() => setPage(1)}>Awal</button>
                          <button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Sebelumnya</button>
                          <span className="gorut-pagination-current">Halaman <strong>{safePage}</strong> dari <strong>{pageCount}</strong></span>
                          <button type="button" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}>Berikutnya</button>
                          <button type="button" disabled={safePage === pageCount} onClick={() => setPage(pageCount)}>Akhir</button>
                        </div>
                      </div>
                    </footer>
                  </>
                )}
              </section>
            </main>
          </div>

          <MobileSidebar
            open={mobileMenu}
            onClose={() => setMobileMenu(false)}
            navigation={mainNavigation}
            secondaryNavigation={operationalNavigation}
            masterNavigation={masterDataNavigation}
            bottomNavigation={bottomNavigation}
            target={target}
          />

          <MobileBottomNav navigation={mobileNavigation} onMore={() => setMobileMenu(true)} onUnavailable={(label) => triggerNotice(`${label}: Segera tersedia`)} />

          {notice ? <div className="gorut-mobile-notice" role="status"><Building2 size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />{notice}</div> : null}

          <UpzisDetailDrawer
            open={Boolean(detailRecap)}
            recap={detailRecap}
            onClose={closeDetail}
            onRecap={() => { if (detailRecap) createRecap(detailRecap); }}
            onMinutes={() => { if (detailRecap) setMinutesRecap(detailRecap); }}
          />

          <BeritaAcaraDialog recap={minutesRecap} onClose={() => setMinutesRecap(null)} />
        </div>
      )}
    </div>
  );
}
