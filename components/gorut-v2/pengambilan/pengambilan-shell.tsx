'use client';

import { HandCoins, Plus, SearchX } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import type { CollectionBatch } from '@/features/gorut-v2/types';
import { formatNumber } from '@/features/gorut-v2/formatters';
import { currentCollectionPeriod, gorutCollectionBatches } from '@/features/gorut-v2/pengambilan-mock-data';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';

import { GorutSidebar } from '../gorut-sidebar';
import { MobileSidebar } from '../mobile-sidebar';
import { MobileBottomNav } from '../mobile-bottom-nav';
import { GorutHeader } from '../gorut-header';
import { PenghimpunanTabs } from '../penghimpunan-tabs';

import { PengambilanSummary } from './pengambilan-summary';
import { PengambilanFilterBar, initialCollectionFilters, type CollectionFilters } from './pengambilan-filter-bar';
import { PengambilanTable } from './pengambilan-table';
import { PengambilanMobileList } from './pengambilan-mobile-list';
import { PengambilanDetailDrawer } from './pengambilan-detail-drawer';
import { PengambilanWizard } from './pengambilan-wizard';
import { PengambilanSkeleton } from './pengambilan-skeleton';
import { F009Preview } from './f009-preview';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };


export function PengambilanShell() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<CollectionBatch[]>(gorutCollectionBatches);
  const [filters, setFilters] = useState<CollectionFilters>(initialCollectionFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  const [detailBatch, setDetailBatch] = useState<CollectionBatch | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardBatch, setWizardBatch] = useState<CollectionBatch | null>(null);
  const [previewBatch, setPreviewBatch] = useState<CollectionBatch | null>(null);

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
    return batches.filter((batch) => {
      const matchQuery = !query
        || batch.plpkName.toLowerCase().includes(query)
        || batch.village.toLowerCase().includes(query)
        || batch.kecamatan.toLowerCase().includes(query)
        || batch.period.includes(query)
        || batch.entries.some((entry) => entry.munfiqName.toLowerCase().includes(query));
      const matchPeriod = deferredFilters.period === 'all' || batch.period === deferredFilters.period;
      const matchKecamatan = deferredFilters.kecamatan === 'all' || batch.kecamatan === deferredFilters.kecamatan;
      const matchVillage = deferredFilters.village === 'all' || batch.village === deferredFilters.village;
      const matchPlpk = deferredFilters.plpk === 'all' || batch.plpkName === deferredFilters.plpk;
      const matchStatus = deferredFilters.status === 'all' || batch.status === deferredFilters.status;
      return matchQuery && matchPeriod && matchKecamatan && matchVillage && matchPlpk && matchStatus;
    });
  }, [batches, deferredFilters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentBatches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const resetFilters = () => { setFilters(initialCollectionFilters); setPage(1); };

  const handleSave = (batch: CollectionBatch, mode: 'draft' | 'complete') => {
    setBatches((previous) => {
      const exists = previous.some((item) => item.id === batch.id);
      return exists ? previous.map((item) => (item.id === batch.id ? batch : item)) : [batch, ...previous];
    });
    if (detailBatch?.id === batch.id) setDetailBatch(batch);
    setWizardOpen(false);
    setWizardBatch(null);
    triggerNotice(mode === 'draft' ? 'Draft penjemputan berhasil disimpan' : 'Penjemputan selesai. F.009 siap diserahkan ke Kordes.');
  };

  const openWizard = (batch: CollectionBatch | null) => {
    setWizardBatch(batch);
    setWizardOpen(true);
    setDetailBatch(null);
  };

  const completeBatch = (batch: CollectionBatch) => {
    const next: CollectionBatch = { ...batch, status: 'f009-ready', documentStatus: 'Siap' };
    setBatches((previous) => previous.map((item) => (item.id === batch.id ? next : item)));
    setDetailBatch(next);
    triggerNotice('Penjemputan selesai. F.009 siap.');
  };

  const handOverToKordes = (batch: CollectionBatch) => {
    if (batch.documentStatus !== 'Siap' && batch.status !== 'collected' && batch.status !== 'f009-ready' && batch.status !== 'waiting-handover') {
      triggerNotice('Selesaikan penjemputan terlebih dahulu agar F.009 siap.');
      return;
    }
    const next: CollectionBatch = {
      ...batch,
      status: 'handed-to-kordes',
      documentStatus: 'Siap',
      handoverDestination: 'kordes',
      handedToKordesAt: new Date().toISOString().slice(0, 10),
    };
    setBatches((previous) => previous.map((item) => (item.id === batch.id ? next : item)));
    setDetailBatch(next);
    triggerNotice('Batch ditandai diserahkan ke Kordes.');
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
                  <h1>Penjemputan PLPK</h1>
                  <span>Catat hasil penjemputan koin bulanan dari Munfiq dan siapkan Lembar Penerimaan Koin NU.</span>
                </div>
                <button type="button" className="gorut-button gorut-primary-button" onClick={() => openWizard(null)}>
                  <Plus size={14} />Mulai Penjemputan
                </button>
              </section>

              <PengambilanSummary batches={batches} period={currentCollectionPeriod} />

              <PengambilanFilterBar filters={filters} onChange={(next) => { setFilters(next); setPage(1); }} onReset={resetFilters} />

              <section className="gorut-collect-panel">
                {filtered.length === 0 ? (
                  <div className="gorut-collect-empty">
                    <SearchX size={28} />
                    <h2>Belum ada penghimpunan yang cocok</h2>
                    <p>Ubah kata kunci atau reset filter untuk melihat data lainnya.</p>
                    <button type="button" className="gorut-button gorut-secondary-button" onClick={resetFilters}>Reset Filter</button>
                  </div>
                ) : (
                  <>
                    <PengambilanTable
                      batches={currentBatches}
                      onDetail={setDetailBatch}
                      onEdit={openWizard}
                      onPreview={setPreviewBatch}
                      onHandover={handOverToKordes}
                    />

                    <PengambilanMobileList
                      batches={currentBatches}
                      onDetail={setDetailBatch}
                      onEdit={openWizard}
                      onPreview={setPreviewBatch}
                      onHandover={handOverToKordes}
                    />

                    <footer className="gorut-collect-pagination">
                      <div className="gorut-pagination-info">
                        Menampilkan <strong>{Math.min(filtered.length, (page - 1) * pageSize + 1)}–{Math.min(filtered.length, page * pageSize)}</strong> dari <strong>{formatNumber(filtered.length)}</strong> penghimpunan
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

          {notice ? <div className="gorut-mobile-notice" role="status"><HandCoins size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />{notice}</div> : null}

          <PengambilanDetailDrawer
            open={Boolean(detailBatch)}
            batch={detailBatch}
            onClose={() => setDetailBatch(null)}
            onEdit={() => { if (detailBatch) openWizard(detailBatch); }}
            onComplete={() => { if (detailBatch) completeBatch(detailBatch); }}
            onPreview={() => { if (detailBatch) setPreviewBatch(detailBatch); }}
            onHandover={() => { if (detailBatch) handOverToKordes(detailBatch); }}
          />

          <PengambilanWizard
            open={wizardOpen}
            batch={wizardBatch}
            onClose={() => { setWizardOpen(false); setWizardBatch(null); }}
            onSave={handleSave}
          />

          <F009Preview batch={previewBatch} onClose={() => setPreviewBatch(null)} />
        </div>
      )}
    </div>
  );
}
