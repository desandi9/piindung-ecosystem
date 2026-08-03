'use client';

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  HandCoins,
  Info,
  ListFilter,
  Map,
  MapPinned,
  Rows3,
  SearchX,
  UsersRound,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { formatDateShort, formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import {
  buildOpsAttention,
  buildOpsProgress,
  buildOpsRecentBatches,
  buildOpsRegions,
  collectionStatusLabels,
  filterOpsBatches,
  formatPeriodLabel,
  initialOpsFilters,
  opsFilterOptions,
  summarizeOpsBatches,
  type OpsMonitoringFilters,
} from '@/features/gorut-v2/ops-monitoring';
import { useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';
import type { CollectionStatus } from '@/features/gorut-v2/types';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';

import { GorutHeader } from '../gorut-header';
import { GorutSidebar } from '../gorut-sidebar';
import { MobileBottomNav } from '../mobile-bottom-nav';
import { MobileSidebar } from '../mobile-sidebar';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

const shortcuts = [
  { href: '/gorut-v2/penghimpunan/penjemputan-plpk', label: 'Penjemputan PLPK', detail: 'Pantau penjemputan per Munfiq' },
  { href: '/gorut-v2/penghimpunan/verifikasi-kordes', label: 'Verifikasi Kordes', detail: 'Antrean F.009 & koreksi' },
  { href: '/gorut-v2/penghimpunan/verifikasi-upzis', label: 'Verifikasi UPZIS', detail: 'Rekap desa/ranting' },
  { href: '/gorut-v2/dokumen-administrasi', label: 'Dokumen Administrasi', detail: 'Preview F.009–F.015' },
] as const;

export function MonitoringShell() {
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState<OpsMonitoringFilters>(initialOpsFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const batches = useCollectionBatches();
  const deferredFilters = useDeferredValue(filters);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const triggerNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const options = useMemo(() => opsFilterOptions(batches), [batches]);
  const filtered = useMemo(() => filterOpsBatches(batches, deferredFilters), [batches, deferredFilters]);
  const summary = useMemo(() => summarizeOpsBatches(filtered), [filtered]);
  const progress = useMemo(() => buildOpsProgress(filtered), [filtered]);
  const attention = useMemo(() => buildOpsAttention(filtered), [filtered]);
  const regions = useMemo(() => buildOpsRegions(filtered), [filtered]);
  const recent = useMemo(() => buildOpsRecentBatches(filtered), [filtered]);

  const pageCount = Math.max(1, Math.ceil(regions.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRegions = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return regions.slice(start, start + pageSize);
  }, [pageSize, regions, safePage]);

  const filtersActive =
    filters.period !== 'all'
    || filters.kecamatan !== 'all'
    || filters.village !== 'all'
    || filters.status !== 'all';

  const resetFilters = () => {
    setFilters(initialOpsFilters);
    setPage(1);
  };

  const changeFilter = <K extends keyof OpsMonitoringFilters>(key: K, value: OpsMonitoringFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  if (loading) {
    return (
      <div className="gorut-viewport">
        <div className="gorut-app">
          <GorutSidebar target={target} />
          <div className="gorut-workspace">
            <GorutHeader title="Monitoring" onMenuOpen={() => setMobileMenu(true)} />
            <main className="gorut-main"><div className="gorut-placeholder-skeleton" aria-busy="true" aria-label="Memuat monitoring" /></main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gorut-viewport">
      <div className="gorut-app">
        <GorutSidebar target={target} />

        <div className="gorut-workspace">
          <GorutHeader title="Monitoring" onMenuOpen={() => setMobileMenu(true)} />

          <main className="gorut-main gorut-collect-main gorut-monitoring-main">
            <section className="gorut-collect-heading" aria-label="Judul halaman">
              <div>
                <p>OPERASIONAL</p>
                <h1>Monitoring Penghimpunan</h1>
                <span>Control room operasional dari batch collection, status proses, dan rekap wilayah yang tersedia di frontend.</span>
              </div>
            </section>

            <section className={`pjm-filters gorut-monitoring-filters${filtersActive ? ' is-active' : ''}`} aria-label="Filter monitoring">
              <div className="pjm-filter">
                <label className="pjm-filter-label" htmlFor="mon-period"><CalendarDays size={14} aria-hidden="true" />Periode</label>
                <select id="mon-period" value={filters.period} onChange={(event) => changeFilter('period', event.target.value)}>
                  <option value="all">Semua Periode</option>
                  {options.periods.map((period) => <option key={period} value={period}>{formatPeriodLabel(period)}</option>)}
                </select>
              </div>
              <div className="pjm-filter">
                <label className="pjm-filter-label" htmlFor="mon-kecamatan"><MapPinned size={14} aria-hidden="true" />Kecamatan/UPZIS</label>
                <select id="mon-kecamatan" value={filters.kecamatan} onChange={(event) => changeFilter('kecamatan', event.target.value)}>
                  <option value="all">Semua Kecamatan</option>
                  {options.kecamatan.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="pjm-filter">
                <label className="pjm-filter-label" htmlFor="mon-village"><Map size={14} aria-hidden="true" />Desa/Ranting</label>
                <select id="mon-village" value={filters.village} onChange={(event) => changeFilter('village', event.target.value)}>
                  <option value="all">Semua Desa</option>
                  {options.villages.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="pjm-filter">
                <label className="pjm-filter-label" htmlFor="mon-status"><ListFilter size={14} aria-hidden="true" />Status Proses</label>
                <select id="mon-status" value={filters.status} onChange={(event) => changeFilter('status', event.target.value)}>
                  <option value="all">Semua Status</option>
                  {options.statuses.map((status) => (
                    <option key={status} value={status}>{collectionStatusLabels[status as CollectionStatus]}</option>
                  ))}
                </select>
              </div>
              <div className="gorut-monitoring-filter-footer">
                <span>{filtersActive ? `${formatNumber(filtered.length)} batch cocok dengan filter aktif` : 'Filter menampilkan seluruh batch collection yang tersedia.'}</span>
                <button type="button" className="gorut-collect-reset" onClick={resetFilters} disabled={!filtersActive}>Reset Filter</button>
              </div>
            </section>

            <section className="pjm-summary gorut-monitoring-summary" aria-label="Ringkasan utama">
              <article>
                <div className="pjm-summary-heading"><span><HandCoins size={15} aria-hidden="true" /></span><p>Total Kotor</p></div>
                <strong>{formatRupiah(summary.grossAmount)}</strong>
                <small>Jumlah bruto batch terfilter</small>
              </article>
              <article>
                <div className="pjm-summary-heading"><span><Wallet size={15} aria-hidden="true" /></span><p>Total Bisyaroh</p></div>
                <strong>{formatRupiah(summary.totalPlpkFee)}</strong>
                <small>Upah PLPK terhitung</small>
              </article>
              <article className="is-highlighted">
                <div className="pjm-summary-heading"><span><Banknote size={15} aria-hidden="true" /></span><p>Jumlah Bersih</p></div>
                <strong>{formatRupiah(summary.netAmount)}</strong>
                <small>Kotor − bisyaroh</small>
              </article>
              <article>
                <div className="pjm-summary-heading"><span><UsersRound size={15} aria-hidden="true" /></span><p>Total Batch / PLPK</p></div>
                <strong>{formatNumber(summary.batchCount)} / {formatNumber(summary.plpkCount)}</strong>
                <small>Batch dan PLPK unik</small>
              </article>
            </section>

            <section className="pjm-summary gorut-monitoring-process" aria-label="Metrik proses">
              <article>
                <div className="pjm-summary-heading"><span><Clock3 size={15} aria-hidden="true" /></span><p>Belum Lengkap</p></div>
                <strong>{formatNumber(summary.incomplete)}</strong>
                <small>Draft–penjemputan selesai</small>
              </article>
              <article>
                <div className="pjm-summary-heading"><span><Activity size={15} aria-hidden="true" /></span><p>Menunggu Kordes</p></div>
                <strong>{formatNumber(summary.waitingKordes)}</strong>
                <small>Status waiting-kordes-verification</small>
              </article>
              <article>
                <div className="pjm-summary-heading"><span><AlertTriangle size={15} aria-hidden="true" /></span><p>Perlu Koreksi</p></div>
                <strong>{formatNumber(summary.needsCorrection)}</strong>
                <small>Status needs-correction</small>
              </article>
              <article className="is-highlighted">
                <div className="pjm-summary-heading"><span><CheckCircle2 size={15} aria-hidden="true" /></span><p>Terverifikasi Kordes</p></div>
                <strong>{formatNumber(summary.verifiedByKordes)}</strong>
                <small>Status verified-by-kordes</small>
              </article>
            </section>

            <p className="gorut-collect-readonly-note gorut-monitoring-note">
              <Info size={14} aria-hidden="true" />
              Monitoring menampilkan kondisi operasional berdasarkan data frontend yang tersedia. Data produksi akan mengikuti sumber backend setelah integrasi diaktifkan.
            </p>

            <section className="gorut-monitoring-progress" aria-label="Progress operasional">
              <header>
                <h2>Progress Operasional</h2>
                <p>Denominator = total batch pada filter aktif ({formatNumber(filtered.length)} batch).</p>
              </header>
              <div className="gorut-monitoring-progress-grid">
                {progress.map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{formatNumber(item.done)} / {formatNumber(item.total)} batch</span>
                    </div>
                    {item.ratio == null ? (
                      <em>Persentase tidak dihitung — total sumber 0.</em>
                    ) : (
                      <>
                        <div className="gorut-monitoring-progress-track" aria-hidden="true">
                          <i style={{ width: `${Math.round(item.ratio * 100)}%` }} />
                        </div>
                        <small>{Math.round(item.ratio * 100)}% dari total batch terfilter</small>
                      </>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="gorut-monitoring-attention" aria-label="Perlu perhatian">
              <header>
                <h2>Perlu Perhatian</h2>
                <p>Prioritas operasional dari status batch existing. Maksimal 12 item.</p>
              </header>
              {attention.length === 0 ? (
                <div className="gorut-collect-empty gorut-monitoring-empty">
                  <CheckCircle2 size={28} />
                  <h3>Tidak ada item prioritas</h3>
                  <p>Seluruh batch pada filter aktif berada dalam kondisi yang tidak membutuhkan tindakan segera.</p>
                </div>
              ) : (
                <ul className="gorut-monitoring-attention-list">
                  {attention.map((item) => (
                    <li key={item.id} className={`is-${item.severity}`}>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </div>
                      <Link href={item.href} className="gorut-monitoring-link">
                        {item.hrefLabel}<ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="pjm-panel gorut-collect-panel gorut-monitoring-panel" aria-label="Status wilayah">
              <header className="pjm-toolbar gorut-monitoring-toolbar">
                <div className="gorut-monitoring-toolbar-title">
                  <h2>Status Wilayah</h2>
                  <p>Dikelompokkan per periode · kecamatan · desa dari batch existing.</p>
                </div>
                <div className="pjm-toolbar-actions">
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
                </div>
              </header>

              {pageRegions.length === 0 ? (
                <div className="gorut-collect-empty">
                  <SearchX size={28} />
                  <h2>Belum ada wilayah yang cocok</h2>
                  <p>{filtersActive ? 'Ubah atau reset filter untuk melihat wilayah lain.' : 'Belum ada batch collection yang dapat digroup per wilayah.'}</p>
                  {filtersActive ? <button type="button" className="gorut-button gorut-secondary-button" onClick={resetFilters}>Reset Filter</button> : null}
                </div>
              ) : (
                <>
                  <div className="pjm-table-wrap gorut-monitoring-table-wrap">
                    <table className="pjm-table gorut-monitoring-table">
                      <thead>
                        <tr>
                          <th>Kecamatan/UPZIS</th>
                          <th>Desa/Ranting</th>
                          <th>Periode</th>
                          <th>PLPK</th>
                          <th>Batch</th>
                          <th className="is-amount">Jumlah Kotor</th>
                          <th className="is-amount">Bisyaroh</th>
                          <th className="is-amount">Jumlah Bersih</th>
                          <th>Tahap Proses</th>
                          <th className="is-action">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRegions.map((row) => (
                          <tr key={row.id} className={row.processTone === 'needs-correction' || row.processTone === 'incomplete' ? 'is-attention' : undefined}>
                            <td><strong>{row.kecamatan}</strong></td>
                            <td><strong>{row.village}</strong></td>
                            <td>{row.periodLabel}</td>
                            <td className="is-center">{formatNumber(row.plpkCount)}</td>
                            <td className="is-center">{formatNumber(row.batchCount)}</td>
                            <td className="is-amount">{formatRupiah(row.grossAmount)}</td>
                            <td className="is-amount">{formatRupiah(row.totalPlpkFee)}</td>
                            <td className="is-amount">{formatRupiah(row.netAmount)}</td>
                            <td className="is-status">
                              <span className={`pjm-badge gorut-monitoring-badge is-${row.processTone}`}>{row.processLabel}</span>
                            </td>
                            <td className="is-action">
                              <Link href="/gorut-v2/penghimpunan/verifikasi-upzis" className="gorut-monitoring-action">Lihat</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="gorut-monitoring-cards">
                    {pageRegions.map((row) => (
                      <article key={`card-${row.id}`}>
                        <header>
                          <div>
                            <strong className="pjm-code">{row.village}</strong>
                            <span className="pjm-name">{row.kecamatan} · {row.periodLabel}</span>
                          </div>
                          <span className={`pjm-badge gorut-monitoring-badge is-${row.processTone}`}>{row.processLabel}</span>
                        </header>
                        <dl>
                          <div><dt>PLPK</dt><dd>{formatNumber(row.plpkCount)}</dd></div>
                          <div><dt>Batch</dt><dd>{formatNumber(row.batchCount)}</dd></div>
                          <div><dt>Kotor</dt><dd>{formatRupiah(row.grossAmount)}</dd></div>
                          <div><dt>Bisyaroh</dt><dd>{formatRupiah(row.totalPlpkFee)}</dd></div>
                          <div className="is-wide"><dt>Bersih</dt><dd>{formatRupiah(row.netAmount)}</dd></div>
                        </dl>
                        <footer>
                          <Link href="/gorut-v2/penghimpunan/verifikasi-upzis" className="gorut-monitoring-action">Lihat di Verifikasi UPZIS</Link>
                        </footer>
                      </article>
                    ))}
                  </div>

                  <footer className="gorut-collect-pagination">
                    <div className="gorut-pagination-info">
                      Menampilkan <strong>{(safePage - 1) * pageSize + 1}–{Math.min(regions.length, safePage * pageSize)}</strong> dari <strong>{formatNumber(regions.length)}</strong> wilayah
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

            <div className="gorut-monitoring-bottom">
              <section className="gorut-monitoring-recent" aria-label="Batch terbaru">
                <header>
                  <h2>Batch Terbaru</h2>
                  <p>Diurutkan dari timestamp existing: verifiedByKordesAt, returnedForCorrectionAt, submittedToKordesAt, confirmedByPlpkAt, lockedAt, createdAt.</p>
                </header>
                {recent.length === 0 ? (
                  <div className="gorut-collect-empty gorut-monitoring-empty">
                    <SearchX size={24} />
                    <h3>Belum ada batch</h3>
                    <p>Tidak ada batch pada filter aktif.</p>
                  </div>
                ) : (
                  <ul>
                    {recent.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.label}</strong>
                          <span>{item.detail}</span>
                          <small>{formatDateShort(item.at)}</small>
                        </div>
                        <Link href={item.href} className="gorut-monitoring-link">{item.hrefLabel}<ArrowRight size={14} aria-hidden="true" /></Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="gorut-monitoring-shortcuts" aria-label="Shortcut operasional">
                <header>
                  <h2>Shortcut Operasional</h2>
                  <p>Route existing — tidak membuat rute baru.</p>
                </header>
                <div className="gorut-monitoring-shortcut-grid">
                  {shortcuts.map((item) => (
                    <Link key={item.href} href={item.href} className="gorut-monitoring-shortcut">
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </section>
            </div>
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

        {notice ? <div className="gorut-mobile-notice" role="status"><FileText size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />{notice}</div> : null}
      </div>
    </div>
  );
}
