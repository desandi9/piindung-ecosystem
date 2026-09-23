'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Building2,
  CircleCheckBig,
  Eye,
  Info,
  Landmark,
  Map,
  MapPinned,
  Phone,
  RotateCcw,
  Rows3,
  Search,
  SearchX,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { formatNumber } from '@/features/gorut-v2/formatters';
import { gorutModalVariants } from '@/features/gorut-v2/motion';

import { GorutAppShell } from '../gorut-app-shell';
import { OperationEmptyState, OperationErrorState, OperationLoadingState } from '../operations/operation-states';
import { OperationPageHeader } from '../operations/operation-page-header';
import { SummaryBand, type SummaryMetric } from '../operations/summary-band';

export type MasterDataMode = 'kecamatan' | 'upzis' | 'plpk';

type DashboardPayload = {
  kecamatanData: Array<{ code: string; nama: string; jumlahDesa: number }>;
};

type MonitoringPayload = {
  plpkPerformance: Array<{
    id: string;
    code: string;
    name: string;
    kecamatan: string;
    ranting: string;
    munfiqCount: number;
  }>;
};

type DistrictRow = {
  code: string;
  name: string;
  rantingCount: number;
  activePlpkCount: number;
  detectedRantings: string[];
};

type PlpkRow = MonitoringPayload['plpkPerformance'][number];
type SelectedRow = { kind: 'district'; row: DistrictRow } | { kind: 'plpk'; row: PlpkRow };

const modeCopy: Record<MasterDataMode, { title: string; description: string; tableLabel: string }> = {
  kecamatan: {
    title: 'Kecamatan',
    description: 'Master wilayah kecamatan aktif dan relasi Desa/Ranting serta PLPK dari source GORUT.',
    tableLabel: 'Daftar Kecamatan',
  },
  upzis: {
    title: 'UPZIS',
    description: 'Master lembaga UPZIS tingkat Kecamatan tanpa membuat duplikasi wilayah baru.',
    tableLabel: 'Daftar UPZIS Kecamatan',
  },
  plpk: {
    title: 'PLPK',
    description: 'Workspace read-only petugas PLPK aktif, wilayah tugas, dan jumlah Munfiq yang tersedia.',
    tableLabel: 'Daftar PLPK',
  },
};

export function MasterDataShell({ mode }: { mode: MasterDataMode }) {
  const reduced = useReducedMotion();
  const copy = modeCopy[mode];
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [monitoring, setMonitoring] = useState<MonitoringPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [kecamatan, setKecamatan] = useState('all');
  const [ranting, setRanting] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<SelectedRow | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardResponse, monitoringResponse] = await Promise.all([
        fetch('/api/gorut/dashboard', { credentials: 'include' }),
        fetch('/api/gorut/monitoring', { credentials: 'include' }),
      ]);
      const [dashboardJson, monitoringJson] = await Promise.all([
        dashboardResponse.json().catch(() => null),
        monitoringResponse.json().catch(() => null),
      ]) as [DashboardPayload | { error?: string } | null, MonitoringPayload | { error?: string } | null];

      if (!dashboardResponse.ok || !dashboardJson || !('kecamatanData' in dashboardJson)) {
        throw new Error(dashboardJson && 'error' in dashboardJson && dashboardJson.error ? dashboardJson.error : 'Source Kecamatan belum dapat dibaca.');
      }
      if (!monitoringResponse.ok || !monitoringJson || !('plpkPerformance' in monitoringJson)) {
        throw new Error(monitoringJson && 'error' in monitoringJson && monitoringJson.error ? monitoringJson.error : 'Source PLPK belum dapat dibaca.');
      }

      setDashboard(dashboardJson);
      setMonitoring(monitoringJson);
    } catch (reason) {
      setDashboard(null);
      setMonitoring(null);
      setError(reason instanceof Error ? reason.message : 'Source Data Master belum dapat dibaca.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected]);

  const plpks = useMemo(() => monitoring?.plpkPerformance ?? [], [monitoring]);
  const districts = useMemo<DistrictRow[]>(() => (dashboard?.kecamatanData ?? []).map((item) => {
    const related = plpks.filter((plpk) => plpk.kecamatan === item.nama);
    return {
      code: item.code,
      name: item.nama,
      rantingCount: item.jumlahDesa,
      activePlpkCount: related.length,
      detectedRantings: [...new Set(related.map((plpk) => plpk.ranting))].sort((a, b) => a.localeCompare(b, 'id-ID')),
    };
  }), [dashboard, plpks]);

  const kecamatanOptions = useMemo(() => [...new Set(plpks.map((item) => item.kecamatan))].sort((a, b) => a.localeCompare(b, 'id-ID')), [plpks]);
  const rantingOptions = useMemo(() => [...new Set(plpks.filter((item) => kecamatan === 'all' || item.kecamatan === kecamatan).map((item) => item.ranting))].sort((a, b) => a.localeCompare(b, 'id-ID')), [kecamatan, plpks]);
  const query = search.trim().toLocaleLowerCase('id-ID');
  const filteredDistricts = useMemo(() => districts.filter((row) => {
    if (status !== 'all' && status !== 'active') return false;
    return !query || [row.code, row.name, ...row.detectedRantings].join(' ').toLocaleLowerCase('id-ID').includes(query);
  }), [districts, query, status]);
  const filteredPlpks = useMemo(() => plpks.filter((row) => {
    if (status !== 'all' && status !== 'active') return false;
    if (kecamatan !== 'all' && row.kecamatan !== kecamatan) return false;
    if (ranting !== 'all' && row.ranting !== ranting) return false;
    return !query || [row.code, row.name, row.kecamatan, row.ranting].join(' ').toLocaleLowerCase('id-ID').includes(query);
  }), [kecamatan, plpks, query, ranting, status]);

  const rowCount = mode === 'plpk' ? filteredPlpks.length : filteredDistricts.length;
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedDistricts = filteredDistricts.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pagedPlpks = filteredPlpks.slice((safePage - 1) * pageSize, safePage * pageSize);
  const filtersActive = Boolean(query) || status !== 'all' || kecamatan !== 'all' || ranting !== 'all';
  const activeRantingCount = useMemo(() => new Set(plpks.map((item) => `${item.kecamatan}\u0000${item.ranting}`)).size, [plpks]);

  const metrics = useMemo<SummaryMetric[]>(() => {
    if (mode === 'kecamatan') return [
      { id: 'total', label: 'Total Kecamatan', value: '—', detail: 'Seluruh status belum diekspos', icon: <MapPinned size={18} aria-hidden="true" /> },
      { id: 'active', label: 'Kecamatan Aktif', value: formatNumber(districts.length), detail: 'Dari source dashboard', tone: 'positive', icon: <CircleCheckBig size={18} aria-hidden="true" /> },
      { id: 'ranting', label: 'Total Desa / Ranting', value: formatNumber(districts.reduce((sum, row) => sum + row.rantingCount, 0)), detail: 'Pada kecamatan aktif', icon: <Map size={18} aria-hidden="true" /> },
      { id: 'plpk', label: 'Total PLPK', value: formatNumber(plpks.length), detail: 'PLPK aktif termuat', icon: <Landmark size={18} aria-hidden="true" /> },
    ];
    if (mode === 'upzis') return [
      { id: 'total', label: 'Total UPZIS', value: formatNumber(districts.length), detail: 'Mapping kecamatan aktif', icon: <Building2 size={18} aria-hidden="true" /> },
      { id: 'linked', label: 'Kecamatan Terhubung', value: formatNumber(districts.length), detail: 'Satu UPZIS per Kecamatan', tone: 'positive', icon: <MapPinned size={18} aria-hidden="true" /> },
      { id: 'ranting', label: 'Total Ranting', value: formatNumber(districts.reduce((sum, row) => sum + row.rantingCount, 0)), detail: 'Dari source wilayah', icon: <Map size={18} aria-hidden="true" /> },
      { id: 'plpk', label: 'Total PLPK', value: formatNumber(plpks.length), detail: 'PLPK aktif termuat', icon: <UsersRound size={18} aria-hidden="true" /> },
    ];
    return [
      { id: 'total', label: 'Total PLPK', value: '—', detail: 'Seluruh status belum diekspos', icon: <UsersRound size={18} aria-hidden="true" /> },
      { id: 'active', label: 'PLPK Aktif', value: formatNumber(plpks.length), detail: 'Dari source monitoring', tone: 'positive', icon: <CircleCheckBig size={18} aria-hidden="true" /> },
      { id: 'region', label: 'Wilayah Terisi', value: formatNumber(activeRantingCount), detail: 'Ranting unik pada source', icon: <MapPinned size={18} aria-hidden="true" /> },
      { id: 'follow-up', label: 'Perlu Tindak Lanjut', value: '—', detail: 'Belum diekspos source', icon: <ShieldCheck size={18} aria-hidden="true" /> },
    ];
  }, [activeRantingCount, districts, mode, plpks]);

  const resetFilters = () => { setSearch(''); setStatus('all'); setKecamatan('all'); setRanting('all'); setPage(1); };

  return (
    <GorutAppShell title={copy.title} loading={loading}>
      <div className={`gorut-munfiq-workspace gorut-admin-workspace gorut-master-workspace gorut-${mode}-master-workspace`}>
        <OperationPageHeader
          eyebrow="Data Master"
          title={copy.title}
          description={copy.description}
          meta={<span className="gorut-admin-source-pill"><ShieldCheck size={14} aria-hidden="true" />Source produksi · read-only</span>}
        />

        <SummaryBand metrics={metrics} label={`Ringkasan ${copy.title}`} />

        <section className={`gorut-operation-filters gorut-munfiq-filters gorut-admin-filters${filtersActive ? ' is-active' : ''}`} aria-labelledby={`${mode}-master-filter-title`}>
          <header>
            <div><h2 id={`${mode}-master-filter-title`}>Filter Data</h2><p>Temukan data master tanpa mengubah source wilayah atau petugas.</p></div>
            <button type="button" onClick={resetFilters} disabled={!filtersActive}><RotateCcw size={14} aria-hidden="true" />Reset</button>
          </header>
          <div className="gorut-munfiq-filter-card">
            <div className={`gorut-munfiq-selects gorut-admin-filter-grid gorut-master-filter-grid is-${mode}`}>
              <div className="pjm-filter gorut-master-search-filter">
                <label className="pjm-filter-label" htmlFor={`${mode}-master-search`}><Search size={14} aria-hidden="true" />{mode === 'plpk' ? 'Nama / ID / HP' : 'Nama / Kode'}</label>
                <input id={`${mode}-master-search`} type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={mode === 'plpk' ? 'Cari nama, ID, atau HP' : `Cari ${copy.title.toLocaleLowerCase('id-ID')}`} />
              </div>
              {mode === 'plpk' ? <>
                <MasterSelect id="plpk-kecamatan" icon={MapPinned} label="Kecamatan / UPZIS" value={kecamatan} onChange={(value) => { setKecamatan(value); setRanting('all'); setPage(1); }} options={[["all", "Semua Kecamatan / UPZIS"], ...kecamatanOptions.map((item) => [item, item] as const)]} />
                <MasterSelect id="plpk-ranting" icon={Map} label="Desa / Ranting" value={ranting} onChange={(value) => { setRanting(value); setPage(1); }} options={[["all", "Semua Desa / Ranting"], ...rantingOptions.map((item) => [item, item] as const)]} />
              </> : null}
              <MasterSelect id={`${mode}-master-status`} icon={CircleCheckBig} label="Status" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[["all", "Semua Status"], ["active", "Aktif"]]} />
            </div>
          </div>
          <footer><p aria-live="polite">Menampilkan <strong>{formatNumber(rowCount)}</strong> data</p><span>{filtersActive ? 'Filter aktif diterapkan' : 'Belum ada filter aktif'}</span></footer>
        </section>

        <p className="gorut-collect-readonly-note gorut-admin-note">
          <Info size={15} aria-hidden="true" />
          {mode === 'kecamatan'
            ? 'Source dashboard saat ini hanya mengekspos Kecamatan aktif. Total seluruh status tidak dihitung ulang di frontend.'
            : mode === 'upzis'
              ? 'Dalam GORUT, UPZIS berada pada tingkat Kecamatan. Halaman ini memetakan lembaga UPZIS ke Kecamatan yang sama, bukan membuat master wilayah baru.'
              : 'Source monitoring hanya mengekspos PLPK aktif beserta Kecamatan, Ranting, dan jumlah Munfiq. Nomor HP serta total seluruh status tidak direkayasa.'}
        </p>

        <section className="pjm-panel gorut-admin-panel" aria-label={copy.tableLabel}>
          <header className="pjm-toolbar gorut-admin-toolbar gorut-master-toolbar">
            <div className="gorut-master-toolbar-copy"><h2>{copy.tableLabel}</h2><p>{formatNumber(rowCount)} data sesuai filter</p></div>
            <div className="gorut-admin-toolbar-actions">
              <span className="gorut-admin-readiness"><ShieldCheck size={14} aria-hidden="true" />Data aktif</span>
              <label className="pjm-page-size"><Rows3 size={15} aria-hidden="true" /><span>Tampilkan</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span>baris</span></label>
            </div>
          </header>

          {loading ? <OperationLoadingState rows={6} /> : error ? <OperationErrorState message={error} onRetry={() => void loadData()} /> : !rowCount ? (
            <OperationEmptyState icon={<SearchX size={24} aria-hidden="true" />} title="Belum ada data yang cocok" description="Ubah pencarian atau reset filter untuk melihat data lainnya." action={filtersActive ? <button type="button" onClick={resetFilters}>Reset Filter</button> : undefined} />
          ) : mode === 'plpk'
            ? <PlpkRows rows={pagedPlpks} onDetail={(row) => setSelected({ kind: 'plpk', row })} />
            : <DistrictRows mode={mode} rows={pagedDistricts} onDetail={(row) => setSelected({ kind: 'district', row })} />}

          {!loading && !error && rowCount ? <Pagination page={safePage} pageCount={pageCount} pageSize={pageSize} rowCount={rowCount} onPage={setPage} /> : null}
        </section>
      </div>

      {typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {selected ? <MasterDetail mode={mode} selected={selected} reduced={Boolean(reduced)} onClose={() => setSelected(null)} /> : null}
        </AnimatePresence>,
        document.querySelector<HTMLElement>('.gorut-viewport') ?? document.body,
      ) : null}
    </GorutAppShell>
  );
}

function MasterSelect({ id, icon: Icon, label, value, onChange, options }: { id: string; icon: typeof MapPinned; label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return <div className="pjm-filter"><label className="pjm-filter-label" htmlFor={id}><Icon size={14} aria-hidden="true" />{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
}

function DistrictRows({ mode, rows, onDetail }: { mode: 'kecamatan' | 'upzis'; rows: DistrictRow[]; onDetail: (row: DistrictRow) => void }) {
  return <><div className="pjm-table-wrap gorut-admin-table-wrap"><table className="pjm-table gorut-admin-table gorut-master-table"><thead><tr>{mode === 'upzis' ? <><th>ID / Kode UPZIS</th><th>Nama UPZIS</th><th>Kecamatan</th><th>Ketua / Penanggung Jawab</th></> : <><th>Kode</th><th>Kecamatan</th></>}<th>Jumlah Desa / Ranting</th><th>Jumlah PLPK</th><th>Status</th><th>Detail</th></tr></thead><tbody>{rows.map((row) => <tr key={row.code}>{mode === 'upzis' ? <><td><strong>{row.code}</strong><small>Kode wilayah source</small></td><td><strong>UPZIS {row.name}</strong></td><td>{row.name}</td><td><span className="gorut-master-unavailable">Belum tersedia</span></td></> : <><td><strong>{row.code}</strong></td><td><strong>{row.name}</strong></td></>}<td>{formatNumber(row.rantingCount)}</td><td>{formatNumber(row.activePlpkCount)}</td><td><span className="gorut-admin-badge is-success">Aktif</span></td><td><button type="button" className="gorut-admin-detail-button" onClick={() => onDetail(row)}><Eye size={14} aria-hidden="true" />Detail</button></td></tr>)}</tbody></table></div><div className="gorut-admin-cards">{rows.map((row) => <article key={`card-${row.code}`}><header><div><strong>{mode === 'upzis' ? `UPZIS ${row.name}` : row.name}</strong><span>{row.code}</span></div><span className="gorut-admin-badge is-success">Aktif</span></header><dl><div><dt>Desa / Ranting</dt><dd>{formatNumber(row.rantingCount)}</dd></div><div><dt>PLPK aktif</dt><dd>{formatNumber(row.activePlpkCount)}</dd></div></dl><button type="button" className="gorut-admin-detail-button" onClick={() => onDetail(row)}><Eye size={14} aria-hidden="true" />Lihat Detail</button></article>)}</div></>;
}

function PlpkRows({ rows, onDetail }: { rows: PlpkRow[]; onDetail: (row: PlpkRow) => void }) {
  return <><div className="pjm-table-wrap gorut-admin-table-wrap"><table className="pjm-table gorut-admin-table gorut-master-table gorut-plpk-table"><thead><tr><th>ID PLPK</th><th>Nama</th><th>Wilayah Tugas</th><th>No. HP</th><th>Kecamatan / UPZIS</th><th>Jumlah Munfiq</th><th>Status</th><th>Detail</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.code}</strong></td><td><strong>{row.name}</strong></td><td><strong>{row.ranting}</strong><small>{row.kecamatan}</small></td><td><span className="gorut-master-unavailable">Belum tersedia</span></td><td><strong>{row.kecamatan}</strong><small>UPZIS tingkat Kecamatan</small></td><td>{formatNumber(row.munfiqCount)}</td><td><span className="gorut-admin-badge is-success">Aktif</span></td><td><button type="button" className="gorut-admin-detail-button" onClick={() => onDetail(row)}><Eye size={14} aria-hidden="true" />Detail</button></td></tr>)}</tbody></table></div><div className="gorut-admin-cards">{rows.map((row) => <article key={`card-${row.id}`}><header><div><strong>{row.name}</strong><span>{row.code} · {row.ranting}</span></div><span className="gorut-admin-badge is-success">Aktif</span></header><dl><div><dt>Kecamatan / UPZIS</dt><dd>{row.kecamatan}</dd></div><div><dt>Munfiq</dt><dd>{formatNumber(row.munfiqCount)}</dd></div><div><dt>No. HP</dt><dd>Belum tersedia</dd></div><div><dt>Wilayah</dt><dd>{row.ranting}</dd></div></dl><button type="button" className="gorut-admin-detail-button" onClick={() => onDetail(row)}><Eye size={14} aria-hidden="true" />Lihat Detail</button></article>)}</div></>;
}

function Pagination({ page, pageCount, pageSize, rowCount, onPage }: { page: number; pageCount: number; pageSize: number; rowCount: number; onPage: (page: number) => void }) {
  return <footer className="gorut-collect-pagination"><div className="gorut-pagination-info">Menampilkan <strong>{(page - 1) * pageSize + 1}–{Math.min(rowCount, page * pageSize)}</strong> dari <strong>{formatNumber(rowCount)}</strong> data</div><div className="gorut-pagination-controls"><div className="gorut-pagination-buttons"><button type="button" disabled={page === 1} onClick={() => onPage(1)}>Awal</button><button type="button" disabled={page === 1} onClick={() => onPage(page - 1)}>Sebelumnya</button><span className="gorut-pagination-current">Halaman <strong>{page}</strong> dari <strong>{pageCount}</strong></span><button type="button" disabled={page === pageCount} onClick={() => onPage(page + 1)}>Berikutnya</button><button type="button" disabled={page === pageCount} onClick={() => onPage(pageCount)}>Akhir</button></div></div></footer>;
}

function MasterDetail({ mode, selected, reduced, onClose }: { mode: MasterDataMode; selected: SelectedRow; reduced: boolean; onClose: () => void }) {
  if (selected.kind === 'plpk') {
    const row = selected.row;
    return <DialogFrame title={row.name} subtitle="DETAIL PLPK" description="Informasi operasional yang tersedia pada source monitoring GORUT." reduced={reduced} onClose={onClose}><div className="gorut-admin-dialog-status"><span className="gorut-admin-badge is-success">Aktif</span><small>{row.code}</small></div><dl><DetailItem label="ID PLPK" value={row.code} /><DetailItem label="Nama" value={row.name} /><DetailItem label="No. HP" value="Belum tersedia di source" icon={<Phone size={13} aria-hidden="true" />} /><DetailItem label="Kecamatan / UPZIS" value={row.kecamatan} /><DetailItem label="Desa / Ranting" value={row.ranting} /><DetailItem label="Jumlah Munfiq" value={formatNumber(row.munfiqCount)} /><DetailItem label="Status" value="Aktif" /><DetailItem label="Informasi operasional" value="Belum tersedia di read model" /></dl><p className="gorut-admin-dialog-note"><Info size={14} aria-hidden="true" />Tidak ada histori atau informasi kontak yang dibuat ulang di frontend.</p><DialogFooter onClose={onClose} /></DialogFrame>;
  }

  const row = selected.row;
  const isUpzis = mode === 'upzis';
  return <DialogFrame title={isUpzis ? `UPZIS ${row.name}` : row.name} subtitle={isUpzis ? 'DETAIL UPZIS' : 'DETAIL KECAMATAN'} description={isUpzis ? 'UPZIS dipetakan pada wilayah Kecamatan yang sama.' : 'Informasi master wilayah aktif dari source dashboard GORUT.'} reduced={reduced} onClose={onClose}><div className="gorut-admin-dialog-status"><span className="gorut-admin-badge is-success">Aktif</span><small>{row.code}</small></div><dl><DetailItem label={isUpzis ? 'Kode UPZIS / Wilayah' : 'Kode Kecamatan'} value={row.code} /><DetailItem label={isUpzis ? 'Nama UPZIS' : 'Nama Kecamatan'} value={isUpzis ? `UPZIS ${row.name}` : row.name} />{isUpzis ? <><DetailItem label="Kecamatan" value={row.name} /><DetailItem label="Ketua / Penanggung Jawab" value="Belum tersedia di source" icon={<UserRound size={13} aria-hidden="true" />} /></> : null}<DetailItem label="Jumlah Desa / Ranting" value={formatNumber(row.rantingCount)} /><DetailItem label="Jumlah PLPK Aktif" value={formatNumber(row.activePlpkCount)} /><DetailItem label="Status" value="Aktif" /></dl>{!isUpzis ? <section className="gorut-master-dialog-list"><header><div><h3>Desa / Ranting terdeteksi</h3><p>Daftar ini hanya berasal dari relasi PLPK yang termuat; total resminya tetap {formatNumber(row.rantingCount)}.</p></div><Map size={17} aria-hidden="true" /></header>{row.detectedRantings.length ? <ul>{row.detectedRantings.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="gorut-master-list-empty">Belum ada nama Ranting yang terekspos lewat source PLPK.</p>}</section> : <p className="gorut-admin-dialog-note"><Info size={14} aria-hidden="true" />Nama pengurus belum diekspos source. Tidak ada identitas pengurus yang dibuat di frontend.</p>}<DialogFooter onClose={onClose} /></DialogFrame>;
}

function DialogFrame({ title, subtitle, description, reduced, onClose, children }: { title: string; subtitle: string; description: string; reduced: boolean; onClose: () => void; children: React.ReactNode }) {
  const variants = gorutModalVariants(reduced);
  return <motion.div className="gorut-admin-modal-backdrop" role="presentation" initial="hidden" animate="visible" exit="exit" variants={variants.backdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><motion.section className="gorut-admin-dialog gorut-master-dialog" role="dialog" aria-modal="true" aria-labelledby="gorut-master-detail-title" initial="hidden" animate="visible" exit="exit" variants={variants.panel}><header><div><span>{subtitle}</span><h2 id="gorut-master-detail-title">{title}</h2><p>{description}</p></div><button type="button" onClick={onClose} aria-label="Tutup detail"><X size={18} aria-hidden="true" /></button></header>{children}</motion.section></motion.div>;
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div><dt>{icon}{label}</dt><dd>{value}</dd></div>;
}

function DialogFooter({ onClose }: { onClose: () => void }) {
  return <footer><button type="button" className="gorut-button gorut-secondary-button" onClick={onClose}>Tutup</button></footer>;
}
