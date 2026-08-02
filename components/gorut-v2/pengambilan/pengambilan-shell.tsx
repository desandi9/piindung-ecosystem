'use client';

import { Download, Info, Rows3, Search, SearchX } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { formatNumber } from '@/features/gorut-v2/formatters';
import {
  buildMonitoringOptions,
  buildMunfiqRows,
  defaultMonitoringFilters,
  filterMunfiqRows,
  monitoringCollectionBatches,
  resolveMonitoringFilters,
  sortMunfiqRows,
  summarizeMunfiqRows,
  type MonitoringFilters,
  type MonitoringSortDirection,
  type MonitoringSortKey,
} from '@/features/gorut-v2/penjemputan-monitoring';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';

import { GorutSidebar } from '../gorut-sidebar';
import { MobileSidebar } from '../mobile-sidebar';
import { MobileBottomNav } from '../mobile-bottom-nav';
import { GorutHeader } from '../gorut-header';
import { PenghimpunanTabs } from '../penghimpunan-tabs';

import { PenjemputanFilterBar } from './penjemputan-filter-bar';
import { PenjemputanSummary } from './penjemputan-summary';
import { PenjemputanMunfiqTable } from './penjemputan-munfiq-table';
import { PenjemputanMunfiqCards } from './penjemputan-munfiq-cards';
import { PengambilanSkeleton } from './pengambilan-skeleton';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

/**
 * Monitoring Penjemputan PLPK — halaman desktop, read-only.
 *
 * Filter bertingkat, empat card ringkasan, toolbar, lalu tabel berisi satu baris
 * per Munfiq. Seluruh input hasil kunjungan tetap dilakukan PLPK di aplikasi mobile.
 */
export function PengambilanShell() {
  const [loading, setLoading] = useState(true);
  const batches = monitoringCollectionBatches;

  const [requestedFilters, setRequestedFilters] = useState<MonitoringFilters | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<MonitoringSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<MonitoringSortDirection>('asc');
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const triggerNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  /** Filter selalu dinormalkan agar tidak pernah menunjuk kombinasi tanpa data. */
  const filters = useMemo(
    () => (requestedFilters ? resolveMonitoringFilters(batches, requestedFilters) : defaultMonitoringFilters(batches)),
    [batches, requestedFilters],
  );

  const options = useMemo(() => buildMonitoringOptions(batches, filters), [batches, filters]);
  const allRows = useMemo(() => buildMunfiqRows(batches, filters), [batches, filters]);

  /** Ringkasan dihitung dari seluruh Munfiq PLPK terpilih, bukan dari hasil pencarian. */
  const summary = useMemo(
    () => summarizeMunfiqRows(allRows, options.plpk.find((item) => item.id === filters.plpkId)),
    [allRows, filters.plpkId, options.plpk],
  );

  const visibleRows = useMemo(
    () => sortMunfiqRows(filterMunfiqRows(allRows, deferredQuery), sortKey, sortDirection),
    [allRows, deferredQuery, sortDirection, sortKey],
  );

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return visibleRows.slice(start, start + pageSize);
  }, [pageSize, safePage, visibleRows]);

  const changeFilters = (next: MonitoringFilters) => {
    setRequestedFilters(next);
    setPage(1);
  };

  const toggleSort = (key: MonitoringSortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  return (
    <div className="gorut-viewport">
      {loading ? (
        <div className="gorut-app">
          <GorutSidebar target={target} />
          <div className="gorut-workspace">
            <GorutHeader title="Penghimpunan" onMenuOpen={() => setMobileMenu(true)} />
            <main className="gorut-main"><PengambilanSkeleton /></main>
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
                  <h1>Monitoring Penjemputan PLPK</h1>
                  <span>Pantau hasil penjemputan setiap Munfiq berdasarkan UPZIS, ranting, PLPK, dan periode.</span>
                </div>
              </section>

              <PenjemputanFilterBar filters={filters} options={options} onChange={changeFilters} />

              <PenjemputanSummary summary={summary} />

              <p className="gorut-collect-readonly-note">
                <Info size={14} aria-hidden="true" />
                Halaman ini bersifat pemantauan. Pencatatan nominal dan konfirmasi penjemputan hanya dapat dilakukan PLPK di aplikasi mobile.
              </p>

              <section className="pjm-panel">
                <header className="pjm-toolbar">
                  <label className="pjm-search">
                    <Search size={16} aria-hidden="true" />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                      placeholder="Cari Munfiq, kode kaleng, atau alamat"
                      aria-label="Cari Munfiq, kode kaleng, atau alamat"
                    />
                  </label>

                  <div className="pjm-toolbar-actions">
                    <label className="pjm-page-size">
                      <Rows3 size={15} aria-hidden="true" />
                      <span>Tampilkan</span>
                      <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span>baris</span>
                    </label>
                    <button type="button" className="pjm-export" onClick={() => triggerNotice('Export: prototipe UI, belum tersedia')}>
                      <Download size={15} aria-hidden="true" />Export
                    </button>
                  </div>
                </header>

                {pageRows.length === 0 ? (
                  <div className="gorut-collect-empty">
                    <SearchX size={28} />
                    <h2>Belum ada Munfiq yang cocok</h2>
                    <p>Ubah kata kunci pencarian atau pilih kombinasi filter lain.</p>
                  </div>
                ) : (
                  <>
                    <PenjemputanMunfiqTable
                      rows={pageRows}
                      startNumber={(safePage - 1) * pageSize + 1}
                      sortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={toggleSort}
                    />

                    <PenjemputanMunfiqCards rows={pageRows} startNumber={(safePage - 1) * pageSize + 1} />

                    <footer className="gorut-collect-pagination">
                      <div className="gorut-pagination-info">
                        Menampilkan <strong>{(safePage - 1) * pageSize + 1}–{Math.min(visibleRows.length, safePage * pageSize)}</strong> dari <strong>{formatNumber(visibleRows.length)}</strong> Munfiq
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

          {notice ? <div className="gorut-mobile-notice" role="status">{notice}</div> : null}
        </div>
      )}
    </div>
  );
}
