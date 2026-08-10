'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { gorutMunfiqData } from '@/features/gorut-v2/munfiq-mock-data';
import type { GorutMunfiq } from '@/features/gorut-v2/types';
import { countActiveFilters, formatResultSummary } from '@/features/gorut-v2/operation-view';

import { GorutAppShell } from '../gorut-app-shell';
import { DataSurface } from '../operations/data-surface';
import { FilterShell } from '../operations/filter-shell';
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

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

export function MunfiqShell() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GorutMunfiq[]>(gorutMunfiqData);
  const [filters, setFilters] = useState<MunfiqFilters>(initialMunfiqFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
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
      const matchUpzis = deferredFilters.upzis === 'all' || item.upzis === deferredFilters.upzis;
      const matchPlpk = deferredFilters.plpk === 'all' || item.plpkId === deferredFilters.plpk || item.plpkName === deferredFilters.plpk;
      const matchStatus = deferredFilters.status === 'all' || item.status === deferredFilters.status;

      return matchQuery && matchKecamatan && matchUpzis && matchPlpk && matchStatus;
    });
  }, [items, deferredFilters]);

  // Pagination logic
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);
  const activeFilterCount = countActiveFilters([filters.query, filters.kecamatan, filters.upzis, filters.plpk, filters.status]);
  const resetFilters = () => { setFilters(initialMunfiqFilters); setPage(1); };

  // Bulk actions handlers
  const handleToggleRow = (id: string) => {
    setCheckedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleToggleAll = () => {
    const ids = currentItems.map((x) => x.id);
    const allSelected = ids.every((id) => checkedIds.includes(id));
    if (allSelected) {
      setCheckedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setCheckedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleBulkStatusChange = (status: GorutMunfiq['status']) => {
    setItems((prev) => prev.map((x) => checkedIds.includes(x.id) ? { ...x, status } : x));
    setCheckedIds([]);
    triggerNotice(`Status ${checkedIds.length} Munfiq berhasil diperbarui`);
  };

  const handleBulkExport = () => {
    triggerNotice(`Mengekspor ${checkedIds.length} data Munfiq terpilih`);
    setCheckedIds([]);
  };

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
      setCheckedIds((prev) => prev.filter((id) => id !== deleteItem.id));
      triggerNotice('Data Munfiq berhasil dihapus');
      setDeleteItem(null);
    }
  };

  return (
    <>
      <GorutAppShell title="Munfiq" target={target} loading={loading}>
        {loading ? <MunfiqSkeleton /> : (
          <div className="gorut-munfiq-workspace">
              <OperationPageHeader
                eyebrow="Data master"
                title="Direktori Munfiq"
                description="Kelola identitas, wilayah, penanggung jawab, dan status penghimpunan dalam satu ruang kerja."
                action={<MunfiqToolbar onCreate={() => { setFormItem(null); setFormOpen(true); }} onNotice={triggerNotice} />}
              />
              <MunfiqSummary items={items} />

              <FilterShell
                activeCount={activeFilterCount}
                resultSummary={formatResultSummary(filteredItems.length, items.length, 'Munfiq')}
                onReset={resetFilters}
              >
                <MunfiqFilterBar filters={filters} onChange={(next) => { setFilters(next); setPage(1); }} />
              </FilterShell>

              {/* Bulk Actions Panel */}
              {checkedIds.length > 0 ? (
                <div className="gorut-munfiq-bulk" role="toolbar" aria-label="Aksi massal">
                  <span><strong>{checkedIds.length}</strong> Munfiq dipilih</span>
                  <div className="gorut-munfiq-bulk-actions">
                    <button type="button" className="gorut-button gorut-secondary-button" onClick={() => handleBulkStatusChange('active')}>Set Aktif</button>
                    <button type="button" className="gorut-button gorut-secondary-button" onClick={() => handleBulkStatusChange('inactive')}>Set Nonaktif</button>
                    <button type="button" className="gorut-button gorut-secondary-button" onClick={handleBulkExport}>Ekspor</button>
                    <button type="button" className="gorut-button gorut-secondary-button" onClick={() => setCheckedIds([])}>Batal</button>
                  </div>
                </div>
              ) : null}

              {filteredItems.length === 0 ? (
                <MunfiqEmptyState onReset={resetFilters} />
              ) : (
                <section className="gorut-munfiq-results">
                  <DataSurface
                    label="Daftar Munfiq"
                    desktop={<MunfiqTable items={currentItems} checkedIds={checkedIds} onToggle={handleToggleRow} onToggleAll={handleToggleAll} onDetail={setDetailItem} onEdit={(item) => { setFormItem(item); setFormOpen(true); }} onDelete={setDeleteItem} onNotice={triggerNotice} />}
                    mobile={<MunfiqMobileList items={currentItems} onDetail={setDetailItem} onEdit={(item) => { setFormItem(item); setFormOpen(true); }} onDelete={setDeleteItem} onNotice={triggerNotice} />}
                  />

                  {/* Pagination footer */}
                  <footer className="gorut-munfiq-pagination">
                    <div className="gorut-pagination-info">
                      Menampilkan <strong>{Math.min(filteredItems.length, (page - 1) * pageSize + 1)}–{Math.min(filteredItems.length, page * pageSize)}</strong> dari <strong>{filteredItems.length}</strong> Munfiq
                    </div>

                    <div className="gorut-pagination-controls">
                      <label className="gorut-pagination-size">
                        <span>Baris per halaman:</span>
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </label>

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
