'use client';

import { Building2, SearchX } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatNumber } from '@/features/gorut-v2/formatters';
import { currentUpzisPeriod, gorutUpzisRecaps } from '@/features/gorut-v2/upzis-mock-data';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';

import { GorutSidebar } from '../gorut-sidebar';
import { MobileSidebar } from '../mobile-sidebar';
import { MobileBottomNav } from '../mobile-bottom-nav';
import { GorutHeader } from '../gorut-header';
import { PenghimpunanTabs } from '../penghimpunan-tabs';

import { UpzisSummary } from './upzis-summary';
import { UpzisFilterBar, initialUpzisFilters, type UpzisFilters } from './upzis-filter-bar';
import { UpzisTable } from './upzis-table';
import { UpzisMobileList } from './upzis-mobile-list';
import { UpzisDetailDrawer } from './upzis-detail-drawer';
import { BeritaAcaraDialog } from './berita-acara-dialog';
import { UpzisSkeleton } from './upzis-skeleton';

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
    const query = deferredFilters.query.trim().toLowerCase();
    return recaps.filter((recap) => {
      const matchQuery = !query
        || recap.village.toLowerCase().includes(query)
        || recap.kecamatan.toLowerCase().includes(query)
        || recap.kordesName.toLowerCase().includes(query)
        || recap.plpkBreakdown.some((item) => item.plpkName.toLowerCase().includes(query));
      const matchPeriod = deferredFilters.period === 'all' || recap.period === deferredFilters.period;
      const matchKecamatan = deferredFilters.kecamatan === 'all' || recap.kecamatan === deferredFilters.kecamatan;
      const matchVillage = deferredFilters.village === 'all' || recap.village === deferredFilters.village;
      const matchKordes = deferredFilters.kordes === 'all' || recap.kordesName === deferredFilters.kordes;
      const matchStatus = deferredFilters.status === 'all' || recap.status === deferredFilters.status;
      return matchQuery && matchPeriod && matchKecamatan && matchVillage && matchKordes && matchStatus;
    });
  }, [recaps, deferredFilters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentRecaps = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const resetFilters = () => { setFilters(initialUpzisFilters); setPage(1); };

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
                  <h1>UPZIS</h1>
                  <span>Rekap penghimpunan koin bulanan per desa, dirangkum dari hasil pengambilan seluruh petugas PLPK.</span>
                </div>
              </section>

              <UpzisSummary recaps={recaps} period={currentUpzisPeriod} />

              <UpzisFilterBar filters={filters} onChange={(next) => { setFilters(next); setPage(1); }} onReset={resetFilters} />

              <section className="gorut-collect-panel">
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
                      onDetail={setDetailRecap}
                      onRecap={createRecap}
                      onMinutes={setMinutesRecap}
                    />

                    <UpzisMobileList
                      recaps={currentRecaps}
                      onDetail={setDetailRecap}
                      onRecap={createRecap}
                      onMinutes={setMinutesRecap}
                    />

                    <footer className="gorut-collect-pagination">
                      <div className="gorut-pagination-info">
                        Menampilkan <strong>{Math.min(filtered.length, (page - 1) * pageSize + 1)}–{Math.min(filtered.length, page * pageSize)}</strong> dari <strong>{formatNumber(filtered.length)}</strong> desa
                      </div>
                      <div className="gorut-pagination-controls">
                        <label className="gorut-pagination-size">
                          <span>Baris per halaman:</span>
                          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                        </label>
                        <div className="gorut-pagination-buttons">
                          <button type="button" disabled={page === 1} onClick={() => setPage(1)}>Awal</button>
                          <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button>
                          <span className="gorut-pagination-current">Halaman <strong>{page}</strong> dari <strong>{pageCount}</strong></span>
                          <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Berikutnya</button>
                          <button type="button" disabled={page === pageCount} onClick={() => setPage(pageCount)}>Akhir</button>
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
            onClose={() => setDetailRecap(null)}
            onRecap={() => { if (detailRecap) createRecap(detailRecap); }}
            onMinutes={() => { if (detailRecap) setMinutesRecap(detailRecap); }}
          />

          <BeritaAcaraDialog recap={minutesRecap} onClose={() => setMinutesRecap(null)} />
        </div>
      )}
    </div>
  );
}
