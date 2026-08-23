'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { gorutMunfiqData } from '@/features/gorut-v2/munfiq-mock-data';
import type { GorutMunfiq } from '@/features/gorut-v2/types';

import { GorutAppShell } from '../gorut-app-shell';
import { DataSurface } from '../operations/data-surface';
import { OperationPageHeader } from '../operations/operation-page-header';

import { MunfiqSummary } from './munfiq-summary';
import { MunfiqToolbar } from './munfiq-toolbar';
import { MunfiqFilterBar, initialMunfiqFilters, type MunfiqFilters } from './munfiq-filter-bar';
import { MunfiqTable } from './munfiq-table';
import { MunfiqMobileList } from './munfiq-mobile-list';
import { MunfiqDetailDrawer } from './munfiq-detail-drawer';
import { MunfiqFormDialog } from './munfiq-form-dialog';
import { DeleteMunfiqDialog } from './delete-munfiq-dialog';
import { MunfiqEmptyState } from './munfiq-empty-state';
import { MunfiqSkeleton } from './munfiq-skeleton';

export type MunfiqDraft = Pick<GorutMunfiq, 'name' | 'phone' | 'email' | 'address' | 'kecamatan' | 'village' | 'upzis' | 'plpkName' | 'status' | 'notes'>;

export function MunfiqShell() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GorutMunfiq[]>(gorutMunfiqData);
  const [filters, setFilters] = useState<MunfiqFilters>(initialMunfiqFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState('');

  // Modals state
  const [detailItem, setDetailItem] = useState<GorutMunfiq | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formItem, setFormItem] = useState<GorutMunfiq | null>(null);
  const [deleteItem, setDeleteItem] = useState<GorutMunfiq | null>(null);

  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const triggerNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  // Filter logic
  const filteredItems = useMemo(() => {
    const query = deferredFilters.query.trim().toLowerCase();
    return items.filter((item) => {
      const matchQuery = !query ||
        item.name.toLowerCase().includes(query) ||
        item.memberId.toLowerCase().includes(query) ||
        item.phone.includes(query) ||
        item.address.toLowerCase().includes(query) ||
        item.plpkName.toLowerCase().includes(query);
      const matchKecamatan = deferredFilters.kecamatan === 'all' || item.kecamatan === deferredFilters.kecamatan;
      const matchVillage = deferredFilters.village === 'all' || item.village === deferredFilters.village;
      const matchPlpk = deferredFilters.plpk === 'all' || item.plpkId === deferredFilters.plpk || item.plpkName === deferredFilters.plpk;
      const matchStatus = deferredFilters.status === 'all' || item.status === deferredFilters.status;

      return matchQuery && matchKecamatan && matchVillage && matchPlpk && matchStatus;
    });
  }, [items, deferredFilters]);

  // Pagination logic
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);
  const resetFilters = () => { setFilters(initialMunfiqFilters); setPage(1); };

  // Form submit (create or update)
  const handleSaveMunfiq = (draft: MunfiqDraft) => {
    if (formItem) {
      // Edit
      setItems((prev) => prev.map((x) => x.id === formItem.id ? { ...x, ...draft } : x));
      // Update open detail drawer if it's the same item
      if (detailItem?.id === formItem.id) {
        setDetailItem((prev) => prev ? { ...prev, ...draft } : null);
      }
      triggerNotice('Data Munfiq berhasil diperbarui');
    } else {
      // Add
      const nextIdNumber = items.length + 1;
      const nextIdStr = String(nextIdNumber).padStart(3, '0');
      const newRecord: GorutMunfiq = {
        id: `munfiq-${nextIdStr}`,
        memberId: `GOR-MQ-${nextIdStr}`,
        name: draft.name,
        phone: draft.phone,
        email: draft.email,
        address: draft.address,
        kecamatan: draft.kecamatan,
        village: draft.village,
        upzis: draft.upzis,
        plpkId: 'PLPK-01',
        plpkName: draft.plpkName,
        status: draft.status,
        joinedAt: new Date().toISOString().split('T')[0],
        totalCollected: 0,
        transactionCount: 0,
        notes: draft.notes,
      };
      setItems((prev) => [newRecord, ...prev]);
      triggerNotice('Munfiq berhasil ditambahkan');
    }
    setFormOpen(false);
    setFormItem(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteItem) {
      setItems((prev) => prev.filter((x) => x.id !== deleteItem.id));
      if (detailItem?.id === deleteItem.id) {
        setDetailItem(null);
      }
      triggerNotice('Data Munfiq berhasil dihapus');
      setDeleteItem(null);
    }
  };

  return (
    <>
      <GorutAppShell title="Munfiq" loading={loading}>
        {loading ? <MunfiqSkeleton /> : (
          <div className="gorut-munfiq-workspace">
              <OperationPageHeader
                eyebrow="Data master"
                title="Direktori Munfiq"
                description="Kelola data Munfiq, penugasan PLPK, dan informasi penghimpunan."
                action={<MunfiqToolbar onCreate={() => { setFormItem(null); setFormOpen(true); }} onNotice={triggerNotice} />}
              />
              <MunfiqSummary items={items} />

              <MunfiqFilterBar
                filters={filters}
                items={items}
                resultCount={filteredItems.length}
                onChange={(next) => { setFilters(next); setPage(1); }}
                onReset={resetFilters}
              />

              {filteredItems.length === 0 ? (
                <MunfiqEmptyState onReset={resetFilters} />
              ) : (
                <section className="gorut-munfiq-results">
                  <header className="gorut-munfiq-table-toolbar">
                    <div><h2>Daftar Munfiq</h2><p>Menampilkan {filteredItems.length} Munfiq</p></div>
                    <label className="gorut-pagination-size"><span>Jumlah baris</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label>
                  </header>
                  <DataSurface
                    label="Daftar Munfiq"
                    desktop={<MunfiqTable items={currentItems} onDetail={setDetailItem} />}
                    mobile={<MunfiqMobileList items={currentItems} onDetail={setDetailItem} />}
                  />

                  {/* Pagination footer */}
                  <footer className="gorut-munfiq-pagination">
                    <div className="gorut-pagination-info">
                      Menampilkan <strong>{Math.min(filteredItems.length, (page - 1) * pageSize + 1)}–{Math.min(filteredItems.length, page * pageSize)}</strong> dari <strong>{filteredItems.length}</strong> Munfiq
                    </div>

                    <div className="gorut-pagination-controls">
                      <div className="gorut-pagination-buttons">
                        <button type="button" disabled={page === 1} onClick={() => setPage(1)}>Awal</button>
                        <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button>
                        <span className="gorut-pagination-current">Halaman <strong>{page}</strong> dari <strong>{pageCount}</strong></span>
                        <button type="button" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>Berikutnya</button>
                        <button type="button" disabled={page === pageCount} onClick={() => setPage(pageCount)}>Akhir</button>
                      </div>
                    </div>
                  </footer>
                </section>
              )}
          </div>
        )}
      </GorutAppShell>

          {notice ? <div className="gorut-mobile-notice" role="status">{notice}</div> : null}

          <MunfiqDetailDrawer
            open={Boolean(detailItem)}
            munfiq={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={() => { if (detailItem) { setFormItem(detailItem); setFormOpen(true); } }}
            onDelete={() => { if (detailItem) { setDeleteItem(detailItem); setDetailItem(null); } }}
            onNotice={triggerNotice}
          />

          <MunfiqFormDialog
             open={formOpen}
             munfiq={formItem}
             items={items}
             onClose={() => { setFormOpen(false); setFormItem(null); }}
             onSave={handleSaveMunfiq}
             onViewDuplicate={(item) => { setFormOpen(false); setFormItem(null); setDetailItem(item); }}
           />

          <DeleteMunfiqDialog
            munfiq={deleteItem}
            onClose={() => setDeleteItem(null)}
            onConfirm={handleDeleteConfirm}
          />
    </>
  );
}
