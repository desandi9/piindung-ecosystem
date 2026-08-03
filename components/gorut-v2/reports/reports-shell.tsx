'use client';

import { Banknote, CalendarDays, Download, FileBarChart, HandCoins, Info, ListFilter, Map, MapPinned, Rows3, SearchX, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';
import { buildOpsRegions, filterOpsBatches, initialOpsFilters, summarizeOpsBatches, type OpsMonitoringFilters } from '@/features/gorut-v2/ops-monitoring';
import { collectionStatusLabels, formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';
import { buildReportCsv, buildReportFilename } from '@/features/gorut-v2/report-export';

import { GorutHeader } from '../gorut-header';
import { GorutSidebar } from '../gorut-sidebar';
import { MobileBottomNav } from '../mobile-bottom-nav';
import { MobileSidebar } from '../mobile-sidebar';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

export function ReportsShell() {
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState<OpsMonitoringFilters>(initialOpsFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const batches = useCollectionBatches();

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const triggerNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const options = useMemo(() => ({
    periods: [...new Set(batches.map((batch) => batch.period))].sort().reverse(),
    kecamatan: [...new Set(batches.map((batch) => batch.kecamatan))].sort((a, b) => a.localeCompare(b, 'id-ID')),
    villages: [...new Set(batches.map((batch) => batch.village))].sort((a, b) => a.localeCompare(b, 'id-ID')),
  }), [batches]);
  const filteredBatches = useMemo(() => filterOpsBatches(batches, filters), [batches, filters]);
  const summary = useMemo(() => summarizeOpsBatches(filteredBatches), [filteredBatches]);
  const rows = useMemo(() => buildOpsRegions(filteredBatches), [filteredBatches]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(() => rows.slice((safePage - 1) * pageSize, safePage * pageSize), [pageSize, rows, safePage]);
  const filtersActive = Object.values(filters).some((value) => value !== 'all');

  const changeFilter = (key: keyof OpsMonitoringFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const resetFilters = () => {
    setFilters(initialOpsFilters);
    setPage(1);
  };
  const downloadCsv = () => {
    if (!rows.length) return;
    const blob = new Blob([`\uFEFF${buildReportCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = buildReportFilename(filters.period);
    anchor.click();
    URL.revokeObjectURL(url);
    triggerNotice(`${formatNumber(rows.length)} baris laporan berhasil disiapkan sebagai CSV`);
  };

  if (loading) {
    return <div className="gorut-viewport"><div className="gorut-app"><GorutSidebar target={target} /><div className="gorut-workspace"><GorutHeader title="Laporan" onMenuOpen={() => setMobileMenu(true)} /><main className="gorut-main" aria-busy="true"><div className="gorut-placeholder-skeleton" role="status"><span className="sr-only">Memuat laporan penghimpunan</span></div></main></div></div></div>;
  }

  return (
    <div className="gorut-viewport">
      <div className="gorut-app">
        <GorutSidebar target={target} />
        <div className="gorut-workspace">
          <GorutHeader title="Laporan" onMenuOpen={() => setMobileMenu(true)} />
          <main className="gorut-main gorut-collect-main gorut-reports-main">
            <section className="gorut-collect-heading" aria-label="Judul halaman">
              <div><p>PELAPORAN</p><h1>Laporan Penghimpunan</h1><span>Rekap operasional per periode dan wilayah berdasarkan batch collection yang tersedia.</span></div>
              <button type="button" className="gorut-button gorut-primary-button gorut-reports-download" onClick={downloadCsv} disabled={!rows.length} title={rows.length ? 'Unduh laporan sesuai filter aktif' : 'Tidak ada data untuk diekspor'}><Download size={15} aria-hidden="true" />Unduh CSV</button>
            </section>

            <section className={`pjm-filters gorut-monitoring-filters${filtersActive ? ' is-active' : ''}`} aria-label="Filter laporan penghimpunan">
              <Filter id="report-period" icon={CalendarDays} label="Periode" value={filters.period} onChange={(value) => changeFilter('period', value)} options={[['all', 'Semua Periode'], ...options.periods.map((period) => [period, formatPeriodLabel(period)] as const)]} />
              <Filter id="report-kecamatan" icon={MapPinned} label="Kecamatan / UPZIS" value={filters.kecamatan} onChange={(value) => changeFilter('kecamatan', value)} options={[['all', 'Semua Kecamatan'], ...options.kecamatan.map((item) => [item, item] as const)]} />
              <Filter id="report-village" icon={Map} label="Desa / Ranting" value={filters.village} onChange={(value) => changeFilter('village', value)} options={[['all', 'Semua Desa'], ...options.villages.map((item) => [item, item] as const)]} />
              <Filter id="report-status" icon={ListFilter} label="Status Proses" value={filters.status} onChange={(value) => changeFilter('status', value)} options={[['all', 'Semua Status'], ...Object.entries(collectionStatusLabels)]} />
              <div className="gorut-monitoring-filter-footer"><span>{filtersActive ? `${formatNumber(rows.length)} wilayah cocok dengan filter aktif` : 'Menampilkan seluruh batch yang tersedia pada data frontend.'}</span><button type="button" className="gorut-collect-reset" onClick={resetFilters} disabled={!filtersActive}>Reset Filter</button></div>
            </section>

            <section className="pjm-summary gorut-reports-summary" aria-label="Ringkasan laporan">
              <ReportStat icon={FileBarChart} label="Total Batch" value={formatNumber(summary.batchCount)} detail={`${formatNumber(summary.plpkCount)} PLPK`} />
              <ReportStat icon={Banknote} label="Jumlah Kotor" value={formatRupiah(summary.grossAmount)} detail="Total batch terfilter" />
              <ReportStat icon={WalletCards} label="Bisyaroh PLPK" value={formatRupiah(summary.totalPlpkFee)} detail="Berdasarkan data existing" />
              <ReportStat icon={HandCoins} label="Jumlah Bersih" value={formatRupiah(summary.netAmount)} detail="Kotor dikurangi bisyaroh" highlighted />
            </section>

            <p className="gorut-collect-readonly-note"><Info size={14} aria-hidden="true" />Laporan mengikuti filter aktif dan dapat diunduh sebagai CSV. Ekspor PDF production tetap belum diaktifkan.</p>

            <section className="pjm-panel gorut-monitoring-panel gorut-reports-panel" aria-label="Rincian laporan per wilayah">
              <header className="pjm-toolbar gorut-monitoring-toolbar">
                <div className="gorut-monitoring-toolbar-title"><h2>Rekap per Wilayah</h2><p>Satu baris mewakili kombinasi periode, kecamatan, dan desa/ranting.</p></div>
                <label className="pjm-page-size"><Rows3 size={15} aria-hidden="true" /><span>Tampilkan</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span>baris</span></label>
              </header>

              {!rows.length ? (
                <div className="gorut-collect-empty"><SearchX size={28} aria-hidden="true" /><h2>Belum ada data laporan yang cocok</h2><p>{filtersActive ? 'Ubah atau reset filter untuk melihat data lainnya.' : 'Batch collection belum tersedia untuk dirangkum.'}</p>{filtersActive ? <button type="button" className="gorut-button gorut-secondary-button" onClick={resetFilters}>Reset Filter</button> : null}</div>
              ) : <ReportRows rows={pageRows} />}

              {rows.length ? <footer className="gorut-collect-pagination"><div className="gorut-pagination-info">Menampilkan <strong>{(safePage - 1) * pageSize + 1}–{Math.min(rows.length, safePage * pageSize)}</strong> dari <strong>{formatNumber(rows.length)}</strong> wilayah</div><div className="gorut-pagination-controls"><div className="gorut-pagination-buttons"><button type="button" disabled={safePage === 1} onClick={() => setPage(1)}>Awal</button><button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Sebelumnya</button><span className="gorut-pagination-current">Halaman <strong>{safePage}</strong> dari <strong>{pageCount}</strong></span><button type="button" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}>Berikutnya</button><button type="button" disabled={safePage === pageCount} onClick={() => setPage(pageCount)}>Akhir</button></div></div></footer> : null}
            </section>
          </main>
        </div>
        <MobileSidebar open={mobileMenu} onClose={() => setMobileMenu(false)} navigation={mainNavigation} secondaryNavigation={operationalNavigation} masterNavigation={masterDataNavigation} bottomNavigation={bottomNavigation} target={target} />
        <MobileBottomNav navigation={mobileNavigation} onMore={() => setMobileMenu(true)} onUnavailable={(label) => triggerNotice(`${label}: Segera tersedia`)} />
        {notice ? <div className="gorut-mobile-notice" role="status">{notice}</div> : null}
      </div>
    </div>
  );
}

function Filter({ id, icon: Icon, label, value, onChange, options }: { id: string; icon: typeof CalendarDays; label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return <div className="pjm-filter"><label className="pjm-filter-label" htmlFor={id}><Icon size={14} aria-hidden="true" />{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
}

function ReportStat({ icon: Icon, label, value, detail, highlighted = false }: { icon: typeof FileBarChart; label: string; value: string; detail: string; highlighted?: boolean }) {
  return <article className={highlighted ? 'is-highlighted' : undefined}><div className="pjm-summary-heading"><span><Icon size={15} aria-hidden="true" /></span><p>{label}</p></div><strong>{value}</strong><small>{detail}</small></article>;
}

function ReportRows({ rows }: { rows: ReturnType<typeof buildOpsRegions> }) {
  return <><div className="pjm-table-wrap gorut-reports-table-wrap"><table className="pjm-table gorut-reports-table"><thead><tr><th>Periode</th><th>Kecamatan/UPZIS</th><th>Desa/Ranting</th><th>PLPK</th><th>Batch</th><th className="is-amount">Jumlah Kotor</th><th className="is-amount">Bisyaroh</th><th className="is-amount">Jumlah Bersih</th><th>Status Proses</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.periodLabel}</td><td><strong>{row.kecamatan}</strong></td><td><strong>{row.village}</strong></td><td className="is-center">{formatNumber(row.plpkCount)}</td><td className="is-center">{formatNumber(row.batchCount)}</td><td className="is-amount">{formatRupiah(row.grossAmount)}</td><td className="is-amount">{formatRupiah(row.totalPlpkFee)}</td><td className="is-amount">{formatRupiah(row.netAmount)}</td><td><span className={`pjm-badge gorut-monitoring-badge is-${row.processTone}`}>{row.processLabel}</span></td></tr>)}</tbody></table></div><div className="gorut-reports-cards">{rows.map((row) => <article key={`card-${row.id}`}><header><div><strong className="pjm-code">{row.village}</strong><span className="pjm-name">{row.kecamatan} · {row.periodLabel}</span></div><span className={`pjm-badge gorut-monitoring-badge is-${row.processTone}`}>{row.processLabel}</span></header><dl><div><dt>PLPK</dt><dd>{formatNumber(row.plpkCount)}</dd></div><div><dt>Batch</dt><dd>{formatNumber(row.batchCount)}</dd></div><div><dt>Kotor</dt><dd>{formatRupiah(row.grossAmount)}</dd></div><div><dt>Bisyaroh</dt><dd>{formatRupiah(row.totalPlpkFee)}</dd></div><div className="is-wide"><dt>Bersih</dt><dd>{formatRupiah(row.netAmount)}</dd></div></dl></article>)}</div></>;
}
