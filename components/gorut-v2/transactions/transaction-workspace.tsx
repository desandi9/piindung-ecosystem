'use client';

import { Alert02Icon, BanknoteIcon, CheckmarkCircle02Icon, Clock01Icon, Wallet02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  CalendarDays,
  Eye,
  Info,
  ListFilter,
  LockKeyhole,
  Map,
  MapPinned,
  RotateCcw,
  Rows3,
  Search,
  SearchX,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { gorutModalVariants } from '@/features/gorut-v2/motion';
import {
  formatTransactionDate,
  formatTransactionDateTime,
  formatTransactionPeriod,
  transactionPeriod,
  transactionStateOptions,
  transactionStatusPresentation,
  type GorutTransactionResponse,
  type GorutTransactionRow,
  type GorutTransactionState,
} from '@/features/gorut-v2/transaction-read-model';

import { GorutAppShell } from '../gorut-app-shell';
import { OperationEmptyState, OperationErrorState, OperationLoadingState } from '../operations/operation-states';
import { OperationPageHeader } from '../operations/operation-page-header';
import { SummaryBand, type SummaryMetric } from '../operations/summary-band';

type WorkspaceMode = 'setoran' | 'validasi' | 'approval';
type Filters = { period: string; kecamatan: string; ranting: string; state: string };

const initialFilters: Filters = { period: 'all', kecamatan: 'all', ranting: 'all', state: 'all' };
const waitingStates = new Set<GorutTransactionState>([
  'WAITING_RANTING_VERIFICATION',
  'WAITING_UPZIS_VERIFICATION',
  'WAITING_PC_APPROVAL',
]);
const issueStates = new Set<GorutTransactionState>([
  'RETURNED_TO_PLPK',
  'RETURNED_TO_RANTING',
  'RETURNED_TO_UPZIS',
  'REJECTED',
  'CANCELLED',
]);

export function TransactionWorkspace({ mode }: { mode: WorkspaceMode }) {
  const reduced = useReducedMotion();
  const isSetoran = mode === 'setoran';
  const isValidation = mode === 'validasi';
  const isApproval = mode === 'approval';
  const isPcQueue = isValidation || isApproval;
  const [payload, setPayload] = useState<GorutTransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<GorutTransactionRow | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (isPcQueue) params.set('state', 'WAITING_PC_APPROVAL');
      const response = await fetch(`/api/gorut/transactions?${params.toString()}`, { credentials: 'include' });
      const next = await response.json().catch(() => null) as GorutTransactionResponse | { error?: string } | null;
      if (!response.ok || !next || !('items' in next)) {
        throw new Error(next && 'error' in next && next.error ? next.error : 'Sumber transaksi GORUT belum dapat dibaca.');
      }
      setPayload(next);
    } catch (reason) {
      setPayload(null);
      setError(reason instanceof Error ? reason.message : 'Sumber transaksi GORUT belum dapat dibaca.');
    } finally {
      setLoading(false);
    }
  }, [isPcQueue]);

  useEffect(() => { void loadTransactions(); }, [loadTransactions]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected]);

  const rows = useMemo(() => payload?.items ?? [], [payload]);
  const options = useMemo(() => ({
    periods: [...new Set(rows.map((row) => transactionPeriod(row.transactionDate)))].sort().reverse(),
    kecamatan: [...new Set(rows.map((row) => row.kecamatan))].sort((a, b) => a.localeCompare(b, 'id-ID')),
    ranting: [...new Set(rows.map((row) => row.ranting))].sort((a, b) => a.localeCompare(b, 'id-ID')),
  }), [rows]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return rows.filter((row) => {
      if (query && ![row.transactionCode, row.kecamatan, row.ranting, row.plpk, transactionStatusPresentation[row.currentState].label].join(' ').toLocaleLowerCase('id-ID').includes(query)) return false;
      if (filters.period !== 'all' && transactionPeriod(row.transactionDate) !== filters.period) return false;
      if (filters.kecamatan !== 'all' && row.kecamatan !== filters.kecamatan) return false;
      if (filters.ranting !== 'all' && row.ranting !== filters.ranting) return false;
      if (filters.state !== 'all' && row.currentState !== filters.state) return false;
      return true;
    });
  }, [filters, rows, search]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const filtersActive = search.trim().length > 0 || Object.values(filters).some((value) => value !== 'all');
  const activeFilterChips = isPcQueue ? [
    search.trim() ? { key: 'search' as const, label: `Pencarian: ${search.trim()}` } : null,
    filters.period !== 'all' ? { key: 'period' as const, label: formatTransactionPeriod(filters.period) } : null,
    filters.kecamatan !== 'all' ? { key: 'kecamatan' as const, label: filters.kecamatan } : null,
    filters.ranting !== 'all' ? { key: 'ranting' as const, label: filters.ranting } : null,
    filters.state !== 'all' ? { key: 'state' as const, label: transactionStatusPresentation[filters.state as GorutTransactionState].label } : null,
  ].filter((chip): chip is { key: keyof Filters | 'search'; label: string } => Boolean(chip)) : [];

  const metrics = useMemo<SummaryMetric[]>(() => {
    if (isValidation) {
      return [
        { id: 'queue', label: 'Antrean Menunggu PC', value: formatNumber(payload?.total ?? 0), detail: 'State WAITING_PC_APPROVAL', tone: payload?.total ? 'warning' : 'default', icon: <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={1.8} /> },
        { id: 'loaded', label: 'Data Termuat', value: formatNumber(rows.length), detail: 'Maksimal 100 transaksi', icon: <HugeiconsIcon icon={Wallet02Icon} size={18} strokeWidth={1.8} /> },
        { id: 'incomplete', label: 'Pendukung Belum Lengkap', value: formatNumber(rows.length), detail: 'Bukti dan tanggal setor belum ada', tone: 'warning', icon: <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={1.8} /> },
        { id: 'actions', label: 'Validasi Executable', value: '0', detail: 'Endpoint validasi belum tersedia', icon: <LockKeyhole size={18} aria-hidden="true" /> },
      ];
    }
    if (isApproval) {
      return [
        { id: 'queue', label: 'Menunggu Approval PC', value: formatNumber(payload?.total ?? 0), detail: 'State WAITING_PC_APPROVAL', tone: payload?.total ? 'warning' : 'default', icon: <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={1.8} /> },
        { id: 'loaded', label: 'Data Termuat', value: formatNumber(rows.length), detail: 'Maksimal 100 transaksi', icon: <HugeiconsIcon icon={Wallet02Icon} size={18} strokeWidth={1.8} /> },
        { id: 'incomplete', label: 'Belum Memenuhi', value: formatNumber(rows.length), detail: 'Pendukung keputusan belum ada', tone: 'warning', icon: <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={1.8} /> },
        { id: 'actions', label: 'Approval Executable', value: '0', detail: 'Endpoint approval belum tersedia', icon: <LockKeyhole size={18} aria-hidden="true" /> },
      ];
    }
    return [
      { id: 'total', label: 'Transaksi di Source', value: formatNumber(payload?.total ?? 0), detail: 'Belum seluruhnya siap setor', icon: <HugeiconsIcon icon={Wallet02Icon} size={18} strokeWidth={1.8} /> },
      { id: 'loaded', label: 'Data Termuat', value: formatNumber(rows.length), detail: 'Maksimal 100 terbaru', icon: <HugeiconsIcon icon={BanknoteIcon} size={18} strokeWidth={1.8} /> },
      { id: 'waiting', label: 'Dalam Proses', value: formatNumber(rows.filter((row) => waitingStates.has(row.currentState)).length), detail: 'Berdasarkan state source', tone: 'warning', icon: <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={1.8} /> },
      { id: 'final', label: 'Final di Source', value: formatNumber(rows.filter((row) => row.currentState === 'FINAL_APPROVED').length), detail: 'State FINAL_APPROVED', tone: 'positive', icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={1.8} /> },
    ];
  }, [isApproval, isValidation, payload?.total, rows]);

  const resetFilters = () => { setFilters(initialFilters); setSearch(''); setPage(1); };
  const changeFilter = (key: keyof Filters, value: string) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const removeActiveFilter = (key: keyof Filters | 'search') => {
    if (key === 'search') setSearch('');
    else setFilters((current) => ({ ...current, [key]: 'all' }));
    setPage(1);
  };

  return (
    <GorutAppShell title={isApproval ? 'Approval' : isValidation ? 'Validasi' : 'Setoran'} loading={loading}>
      <div className={`gorut-munfiq-workspace gorut-admin-workspace gorut-${mode}-workspace`}>
        <OperationPageHeader
          eyebrow="Operasional"
          title={isApproval ? 'Approval' : isValidation ? 'Validasi Setoran' : 'Setoran'}
          description={isPcQueue
            ? `Antrean read-only transaksi yang benar-benar berada pada tahap menunggu ${isApproval ? 'approval' : 'pemeriksaan'} PC.`
            : 'Workspace read-only untuk membaca pergerakan transaksi dari UPZIS/Kecamatan menuju PC berdasarkan source existing.'}
          meta={<span className="gorut-admin-source-pill"><ShieldCheck size={14} aria-hidden="true" />Source transaksi · read-only</span>}
        />

        <SummaryBand metrics={metrics} label={isApproval ? 'Ringkasan approval' : isValidation ? 'Ringkasan validasi' : 'Ringkasan setoran'} />

        <section className={`gorut-operation-filters gorut-munfiq-filters gorut-admin-filters${filtersActive ? ' is-active' : ''}`} aria-labelledby={`${mode}-filter-title`}>
          <header>
            <div><h2 id={`${mode}-filter-title`}>Filter Data</h2><p>{isSetoran ? 'Persempit data berdasarkan periode, wilayah, dan state transaksi existing.' : isApproval ? 'Persempit antrean keputusan PC berdasarkan periode, wilayah, dan status existing.' : 'Persempit data tanpa mengubah transaksi atau status workflow.'}</p></div>
            <button type="button" onClick={resetFilters} disabled={!filtersActive}><RotateCcw size={14} aria-hidden="true" />Reset</button>
          </header>
          <div className="gorut-munfiq-filter-card">
            <div className="gorut-munfiq-selects gorut-admin-filter-grid">
              <Filter id={`${mode}-period`} icon={CalendarDays} label="Periode" value={filters.period} onChange={(value) => changeFilter('period', value)} options={[["all", "Semua Periode"], ...options.periods.map((item) => [item, formatTransactionPeriod(item)] as const)]} />
              <Filter id={`${mode}-kecamatan`} icon={MapPinned} label="Kecamatan / UPZIS" value={filters.kecamatan} onChange={(value) => changeFilter('kecamatan', value)} options={[["all", "Semua Kecamatan / UPZIS"], ...options.kecamatan.map((item) => [item, item] as const)]} />
              <Filter id={`${mode}-ranting`} icon={Map} label="Desa / Ranting" value={filters.ranting} onChange={(value) => changeFilter('ranting', value)} options={[["all", "Semua Desa / Ranting"], ...options.ranting.map((item) => [item, item] as const)]} />
              <Filter id={`${mode}-status`} icon={ListFilter} label="Status" value={filters.state} onChange={(value) => changeFilter('state', value)} options={isPcQueue ? [["all", "Menunggu PC"]] : [["all", "Semua Status"], ...transactionStateOptions.map((item) => [item.value, item.label] as const)]} />
              {isValidation ? <UnavailableFilter id="validasi-readiness" icon={ShieldCheck} label="Kesiapan Validasi" value="Belum tersedia di source" className="gorut-validation-disabled-filter" /> : null}
              {isApproval ? <UnavailableFilter id="approval-readiness" icon={ShieldCheck} label="Kesiapan Approval" value="Belum tersedia di source" className="gorut-approval-disabled-filter" /> : null}
            </div>
          </div>
          <footer><p aria-live="polite">Menampilkan <strong>{formatNumber(filteredRows.length)}</strong> data termuat</p>{isPcQueue && activeFilterChips.length ? <div className={isApproval ? 'gorut-approval-active-filters' : 'gorut-validation-active-filters'}><span>Filter aktif:</span><div>{activeFilterChips.map((chip) => <button type="button" key={chip.key} onClick={() => removeActiveFilter(chip.key)}>{chip.label}<X size={12} aria-hidden="true" /></button>)}</div></div> : <span>{filtersActive ? 'Filter aktif diterapkan' : 'Belum ada filter aktif'}</span>}</footer>
        </section>

        <p className="gorut-collect-readonly-note gorut-admin-note">
          <Info size={15} aria-hidden="true" />
          {isPcQueue
            ? isValidation
              ? 'Nominal setoran, bukti setoran, tanggal setoran, dan data pembanding belum tersedia pada read model. Selisih tidak dihitung dan action validasi tetap dinonaktifkan.'
              : 'Hasil validasi, nominal setoran, bukti, tanggal setoran, dan data pembanding belum tersedia. Keputusan Approve, Kembalikan, dan Reject tetap dinonaktifkan.'
            : 'Read model belum menyediakan gross, bisyaroh PLPK, net, tanggal setoran, bukti, atau readiness khusus Setoran. Jumlah Tercatat dan Tanggal Transaksi ditampilkan apa adanya; pencatatan setoran tetap dinonaktifkan.'}
        </p>

        <section className="pjm-panel gorut-admin-panel" aria-label={isApproval ? 'Antrean approval PC' : isValidation ? 'Antrean validasi setoran' : 'Daftar transaksi setoran'}>
          <header className="pjm-toolbar gorut-admin-toolbar">
            <label className="pjm-search"><Search size={16} aria-hidden="true" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari kode, wilayah, atau petugas" aria-label="Cari transaksi" /></label>
            <div className="gorut-admin-toolbar-actions">
              <span className="gorut-admin-readiness" title={isSetoran ? 'Endpoint pencatatan setoran belum tersedia' : isValidation ? 'Endpoint validasi belum tersedia' : isApproval ? 'Endpoint approval belum tersedia' : 'Data hanya dapat dibaca'}><LockKeyhole size={14} aria-hidden="true" />{isSetoran ? 'Pencatatan belum aktif' : isValidation ? 'Validasi belum aktif' : isApproval ? 'Approval belum aktif' : 'Read-only'}</span>
              <label className="pjm-page-size"><Rows3 size={15} aria-hidden="true" /><span>Tampilkan</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span>baris</span></label>
            </div>
          </header>

          {loading ? <OperationLoadingState rows={6} /> : error ? <OperationErrorState message={error} onRetry={() => void loadTransactions()} /> : !filteredRows.length ? (
            <OperationEmptyState
              icon={<SearchX size={24} aria-hidden="true" />}
              title={isPcQueue && !filtersActive ? `Sumber data ${isApproval ? 'approval' : 'validasi'} belum aktif` : 'Belum ada data yang cocok'}
              description={isPcQueue && !filtersActive
                ? `Belum ada transaksi produksi pada state WAITING_PC_APPROVAL. Action ${isApproval ? 'approval' : 'validasi'} tetap dinonaktifkan sampai endpoint workflow tersedia.`
                : isSetoran && !filtersActive ? 'Source transaksi belum mengembalikan data yang dapat ditampilkan pada workspace Setoran.' : 'Ubah pencarian atau reset filter untuk melihat data lainnya.'}
              action={filtersActive ? <button type="button" onClick={resetFilters}>Reset Filter</button> : isPcQueue ? <button type="button" disabled>{isApproval ? 'Approval' : 'Validasi'} belum aktif</button> : undefined}
            />
          ) : <TransactionRows rows={pageRows} showSourceLimit={isSetoran || isValidation || isApproval} showValidationReadiness={isValidation} showApprovalReadiness={isApproval} onDetail={setSelected} />}

          {!loading && !error && filteredRows.length ? <footer className="gorut-collect-pagination"><div className="gorut-pagination-info">Menampilkan <strong>{(safePage - 1) * pageSize + 1}–{Math.min(filteredRows.length, safePage * pageSize)}</strong> dari <strong>{formatNumber(filteredRows.length)}</strong> data termuat</div><div className="gorut-pagination-controls"><div className="gorut-pagination-buttons"><button type="button" disabled={safePage === 1} onClick={() => setPage(1)}>Awal</button><button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Sebelumnya</button><span className="gorut-pagination-current">Halaman <strong>{safePage}</strong> dari <strong>{pageCount}</strong></span><button type="button" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}>Berikutnya</button><button type="button" disabled={safePage === pageCount} onClick={() => setPage(pageCount)}>Akhir</button></div></div></footer> : null}
        </section>
      </div>

      {typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {selected ? <TransactionDetail row={selected} actionLabel={isApproval ? 'Approval' : isValidation ? 'Validasi' : null} isSetoran={isSetoran} isValidation={isValidation} isApproval={isApproval} reduced={Boolean(reduced)} onClose={() => setSelected(null)} /> : null}
        </AnimatePresence>,
        document.querySelector<HTMLElement>('.gorut-viewport') ?? document.body,
      ) : null}
    </GorutAppShell>
  );
}

function Filter({ id, icon: Icon, label, value, onChange, options }: { id: string; icon: typeof CalendarDays; label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return <div className="pjm-filter"><label className="pjm-filter-label" htmlFor={id}><Icon size={14} aria-hidden="true" />{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
}

function UnavailableFilter({ id, icon: Icon, label, value, className }: { id: string; icon: typeof ShieldCheck; label: string; value: string; className: string }) {
  return <div className={`pjm-filter ${className}`} title={`Field ${label.toLocaleLowerCase('id-ID')} belum tersedia pada source`}><label className="pjm-filter-label" htmlFor={id}><Icon size={14} aria-hidden="true" />{label}</label><select id={id} value="unavailable" disabled aria-label={`${label} belum tersedia`}><option value="unavailable">{value}</option></select></div>;
}

function TransactionRows({ rows, showSourceLimit, showValidationReadiness, showApprovalReadiness, onDetail }: { rows: GorutTransactionRow[]; showSourceLimit: boolean; showValidationReadiness: boolean; showApprovalReadiness: boolean; onDetail: (row: GorutTransactionRow) => void }) {
  return <><div className="pjm-table-wrap gorut-admin-table-wrap"><table className="pjm-table gorut-admin-table"><thead><tr>{showApprovalReadiness ? <th>ID Transaksi</th> : null}<th>Periode</th><th>Kecamatan / UPZIS</th><th>Desa / Ranting</th><th>Penyetor / Petugas</th><th className="is-amount">Jumlah Tercatat</th><th>Tanggal Transaksi</th><th>Status</th>{showValidationReadiness ? <th>Kelengkapan</th> : null}{showApprovalReadiness ? <th>Kesiapan Approval</th> : null}<th>Aksi</th></tr></thead><tbody>{rows.map((row) => { const status = transactionStatusPresentation[row.currentState]; return <tr key={row.transactionCode} className={issueStates.has(row.currentState) ? 'is-attention' : undefined}>{showApprovalReadiness ? <td><strong>{row.transactionCode}</strong></td> : null}<td>{formatTransactionPeriod(transactionPeriod(row.transactionDate))}</td><td><strong>{row.kecamatan}</strong><small>UPZIS tingkat Kecamatan</small></td><td>{row.ranting}</td><td><strong>{row.plpk}</strong><small>{formatNumber(row.munfiqCount)} Munfiq</small></td><td className="is-amount"><strong>{formatRupiah(row.totalAmount)}</strong>{showSourceLimit ? <small>Total source · bukan nominal setoran</small> : null}</td><td>{formatTransactionDate(row.transactionDate)}{showSourceLimit ? <small>Tanggal transaksi</small> : null}</td><td><span className={`gorut-admin-badge is-${status.tone}`}>{status.label}</span></td>{showValidationReadiness ? <td><span className="gorut-validation-completeness is-incomplete" title="Nominal setoran, bukti, tanggal setoran, dan pembanding belum tersedia"><AlertTriangle size={13} aria-hidden="true" />Belum lengkap</span></td> : null}{showApprovalReadiness ? <td><span className="gorut-approval-completeness is-incomplete" title="Hasil validasi dan data pendukung keputusan belum tersedia"><AlertTriangle size={13} aria-hidden="true" />Belum memenuhi</span></td> : null}<td><button type="button" className="gorut-admin-detail-button" onClick={() => onDetail(row)}><Eye size={14} aria-hidden="true" />Detail</button></td></tr>; })}</tbody></table></div><div className="gorut-admin-cards">{rows.map((row) => { const status = transactionStatusPresentation[row.currentState]; return <article key={`card-${row.transactionCode}`}><header><div><strong>{row.transactionCode}</strong><span>{row.ranting} · {row.kecamatan}</span></div><span className={`gorut-admin-badge is-${status.tone}`}>{status.label}</span></header><dl><div><dt>Petugas</dt><dd>{row.plpk}</dd></div><div><dt>Jumlah Tercatat</dt><dd>{formatRupiah(row.totalAmount)}</dd></div><div><dt>Tanggal Transaksi</dt><dd>{formatTransactionDate(row.transactionDate)}</dd></div><div><dt>Munfiq</dt><dd>{formatNumber(row.munfiqCount)}</dd></div>{showValidationReadiness ? <div><dt>Kelengkapan</dt><dd>Belum lengkap</dd></div> : null}{showApprovalReadiness ? <div><dt>Kesiapan Approval</dt><dd>Belum memenuhi</dd></div> : null}</dl><button type="button" className="gorut-admin-detail-button" onClick={() => onDetail(row)}><Eye size={14} aria-hidden="true" />Lihat Detail</button></article>; })}</div></>;
}

function TransactionDetail({ row, actionLabel, isSetoran, isValidation, isApproval, reduced, onClose }: { row: GorutTransactionRow; actionLabel: 'Approval' | 'Validasi' | null; isSetoran: boolean; isValidation: boolean; isApproval: boolean; reduced: boolean; onClose: () => void }) {
  const status = transactionStatusPresentation[row.currentState];
  const variants = gorutModalVariants(reduced);
  return <motion.div className="gorut-admin-modal-backdrop" role="presentation" initial="hidden" animate="visible" exit="exit" variants={variants.backdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><motion.section className="gorut-admin-dialog" role="dialog" aria-modal="true" aria-labelledby="gorut-transaction-detail-title" aria-describedby="gorut-transaction-detail-description" initial="hidden" animate="visible" exit="exit" variants={variants.panel}><header><div><span>DETAIL TRANSAKSI</span><h2 id="gorut-transaction-detail-title">{row.transactionCode}</h2><p id="gorut-transaction-detail-description">Informasi read-only dari source transaksi GORUT.</p></div><button type="button" onClick={onClose} aria-label="Tutup detail"><X size={18} aria-hidden="true" /></button></header><div className="gorut-admin-dialog-status"><span className={`gorut-admin-badge is-${status.tone}`}>{status.label}</span><small>{formatTransactionDateTime(row.transactionDate)}</small></div><dl><div><dt>Kecamatan / UPZIS</dt><dd>{row.kecamatan}</dd></div><div><dt>Desa / Ranting</dt><dd>{row.ranting}</dd></div><div><dt>Penyetor / Petugas</dt><dd>{row.plpk}</dd></div><div><dt>Jumlah Munfiq</dt><dd>{formatNumber(row.munfiqCount)}</dd></div><div><dt>Jumlah Tercatat</dt><dd>{formatRupiah(row.totalAmount)}</dd></div><div><dt>State Source</dt><dd>{row.currentState}</dd></div></dl>{isSetoran ? <section className="gorut-setoran-data-gap" aria-labelledby="gorut-setoran-data-gap-title"><div><h3 id="gorut-setoran-data-gap-title">Kelengkapan data setoran</h3><p>Field berikut belum tersedia pada read model transaksi.</p></div><ul><li><span>Gross</span><strong>Belum tersedia</strong></li><li><span>Bisyaroh PLPK</span><strong>Belum tersedia</strong></li><li><span>Net</span><strong>Belum dapat dihitung</strong></li><li><span>Tanggal setoran</span><strong>Belum tersedia</strong></li><li><span>Bukti setoran</span><strong>Belum tersedia</strong></li></ul></section> : null}{isValidation ? <section className="gorut-validation-data-gap" aria-labelledby="gorut-validation-data-gap-title"><div><h3 id="gorut-validation-data-gap-title">Kelengkapan validasi</h3><p>Data dasar transaksi tersedia, tetapi pendukung validasi belum diekspos source.</p></div><ul><li><span>Jumlah Tercatat</span><strong className="is-available">Tersedia</strong></li><li><span>Data Wilayah</span><strong className="is-available">Lengkap</strong></li><li><span>Nominal Setoran</span><strong>Belum tersedia</strong></li><li><span>Bukti Setoran</span><strong>Belum tersedia</strong></li><li><span>Tanggal Setoran</span><strong>Belum tersedia</strong></li><li><span>Data Pembanding</span><strong>Belum tersedia</strong></li></ul><p className="gorut-validation-gap-reason"><Info size={14} aria-hidden="true" />Validasi belum dapat dilakukan karena data pembanding dan dokumen pendukung belum tersedia. Selisih tidak dihitung.</p></section> : null}{isApproval ? <section className="gorut-approval-data-gap" aria-labelledby="gorut-approval-data-gap-title"><div><h3 id="gorut-approval-data-gap-title">Kelengkapan keputusan approval</h3><p>Identitas dasar tersedia, tetapi data pendukung keputusan belum diekspos source.</p></div><ul><li><span>Data Wilayah</span><strong className="is-available">Lengkap</strong></li><li><span>Jumlah Tercatat</span><strong className="is-available">Tersedia</strong></li><li><span>Data Petugas</span><strong className="is-available">Tersedia</strong></li><li><span>Gross</span><strong>Belum tersedia</strong></li><li><span>Bisyaroh PLPK</span><strong>Belum tersedia</strong></li><li><span>Net</span><strong>Belum tersedia</strong></li><li><span>Nominal Setoran</span><strong>Belum tersedia</strong></li><li><span>Bukti Setoran</span><strong>Belum tersedia</strong></li><li><span>Tanggal Setoran</span><strong>Belum tersedia</strong></li><li><span>Data Kordes / Hasil Validasi</span><strong>Belum tersedia</strong></li><li><span>Data Pembanding</span><strong>Belum tersedia</strong></li></ul><p className="gorut-approval-gap-reason"><Info size={14} aria-hidden="true" />Data belum memenuhi kelengkapan untuk proses approval. Keputusan juga belum dapat dilakukan karena endpoint workflow belum tersedia.</p></section> : null}<p className="gorut-admin-dialog-note"><Info size={14} aria-hidden="true" />Bruto, bisyaroh, neto, bukti setor, dan tanggal settlement tidak tersedia pada read model ini.</p><footer><button type="button" className="gorut-button gorut-secondary-button" onClick={onClose}>Tutup</button>{isApproval ? <div className="gorut-approval-disabled-actions"><button type="button" className="gorut-button gorut-secondary-button" disabled title="Endpoint reject belum tersedia">Reject</button><button type="button" className="gorut-button gorut-secondary-button" disabled title="Endpoint pengembalian belum tersedia">Kembalikan</button><button type="button" className="gorut-button gorut-primary-button" disabled title="Endpoint approval belum tersedia dan data pendukung belum lengkap"><LockKeyhole size={14} aria-hidden="true" />Approve</button></div> : actionLabel ? <button type="button" className="gorut-button gorut-primary-button" disabled title={isValidation ? 'Endpoint validasi belum tersedia dan data pendukung belum lengkap' : undefined}><LockKeyhole size={14} aria-hidden="true" />{actionLabel} belum aktif</button> : isSetoran ? <button type="button" className="gorut-button gorut-primary-button" disabled title="Endpoint pencatatan setoran belum tersedia"><LockKeyhole size={14} aria-hidden="true" />Pencatatan belum aktif</button> : null}</footer></motion.section></motion.div>;
}
