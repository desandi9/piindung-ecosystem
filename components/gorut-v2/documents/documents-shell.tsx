'use client';

import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  FileWarning,
  Info,
  ListFilter,
  Map,
  MapPinned,
  Printer,
  Rows3,
  Search,
  SearchX,
  CheckCircle2,
  Hourglass,
  Ban,
} from 'lucide-react';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { KordesDocumentViewer } from '@/components/gorut-v2/documents/kordes-document-viewer';
import { F009Preview } from '@/components/gorut-v2/pengambilan/f009-preview';
import {
  buildDocumentCatalog,
  documentFilterOptions,
  documentKindLabels,
  documentReadinessLabels,
  filterDocumentCatalog,
  findRecapForDocument,
  initialDocumentFilters,
  summarizeDocumentCatalog,
  type DocumentCatalogFilters,
  type DocumentCatalogRow,
  type DocumentKind,
  type DocumentReadiness,
} from '@/features/gorut-v2/document-catalog';
import { formatDateShort, formatNumber } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';

import { GorutHeader } from '../gorut-header';
import { GorutSidebar } from '../gorut-sidebar';
import { MobileBottomNav } from '../mobile-bottom-nav';
import { MobileSidebar } from '../mobile-sidebar';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

type PreviewState =
  | { kind: 'f009'; batchId: string }
  | { kind: 'f010' | 'f015'; recapId: string }
  | null;

export function DocumentsShell() {
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState<DocumentCatalogFilters>(initialDocumentFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detail, setDetail] = useState<DocumentCatalogRow | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);

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

  const catalog = useMemo(() => buildDocumentCatalog(batches), [batches]);
  const options = useMemo(() => documentFilterOptions(catalog), [catalog]);
  const filtered = useMemo(() => filterDocumentCatalog(catalog, deferredFilters), [catalog, deferredFilters]);
  const summary = useMemo(() => summarizeDocumentCatalog(filtered), [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSize, safePage]);

  const filtersActive =
    filters.period !== 'all'
    || filters.kind !== 'all'
    || filters.kecamatan !== 'all'
    || filters.village !== 'all'
    || filters.readiness !== 'all'
    || Boolean(filters.query.trim());

  const resetFilters = () => {
    setFilters(initialDocumentFilters);
    setPage(1);
  };

  const changeFilter = <K extends keyof DocumentCatalogFilters>(key: K, value: DocumentCatalogFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const openPreview = (row: DocumentCatalogRow) => {
    if (row.kind === 'f009' && row.batchId && row.canPreview) {
      setPreview({ kind: 'f009', batchId: row.batchId });
      return;
    }
    if ((row.kind === 'f010' || row.kind === 'f015') && row.recapId && row.canPreview) {
      setPreview({ kind: row.kind, recapId: row.recapId });
      return;
    }
    triggerNotice(row.kind === 'f016' ? 'F.016 belum tersedia — sumber data belum aktif.' : 'Preview belum siap untuk dokumen ini.');
  };

  const previewBatch = preview?.kind === 'f009' ? batches.find((batch) => batch.id === preview.batchId) ?? null : null;
  const previewRecap = preview && preview.kind !== 'f009' ? findRecapForDocument(batches, preview.recapId) : null;

  if (loading) {
    return (
      <div className="gorut-viewport">
        <div className="gorut-app">
          <GorutSidebar target={target} />
          <div className="gorut-workspace">
            <GorutHeader title="Dokumen Administrasi" onMenuOpen={() => setMobileMenu(true)} />
            <main className="gorut-main"><div className="gorut-placeholder-skeleton" aria-busy="true" aria-label="Memuat dokumen administrasi" /></main>
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
          <GorutHeader title="Dokumen Administrasi" onMenuOpen={() => setMobileMenu(true)} />

          <main className="gorut-main gorut-collect-main gorut-documents-main">
            <section className="gorut-collect-heading" aria-label="Judul halaman">
              <div>
                <p>OPERASIONAL</p>
                <h1>Dokumen Administrasi</h1>
                <span>Pusat dokumen operasional F.009, F.010, F.015, dan F.016 berdasarkan data penghimpunan yang tersedia.</span>
              </div>
            </section>

            <section className={`pjm-filters gorut-documents-filters${filtersActive ? ' is-active' : ''}`} aria-label="Filter dokumen administrasi">
              <div className="pjm-filter">
                <label className="pjm-filter-label" htmlFor="doc-period"><CalendarDays size={14} aria-hidden="true" />Periode</label>
                <select id="doc-period" value={filters.period} onChange={(event) => changeFilter('period', event.target.value)}>
                  <option value="all">Semua Periode</option>
                  {options.periods.map((period) => <option key={period} value={period}>{formatPeriodLabel(period)}</option>)}
                </select>
              </div>
              <div className="pjm-filter">
                <label className="pjm-filter-label" htmlFor="doc-kind"><FileText size={14} aria-hidden="true" />Jenis Dokumen</label>
                <select id="doc-kind" value={filters.kind} onChange={(event) => changeFilter('kind', event.target.value)}>
                  <option value="all">Semua Jenis</option>
                  {(Object.keys(documentKindLabels) as DocumentKind[]).map((kind) => (
                    <option key={kind} value={kind}>{documentKindLabels[kind]}</option>
                  ))}
                </select>
              </div>
              <div className="pjm-filter">
                <label className="pjm-filter-label" htmlFor="doc-kecamatan"><MapPinned size={14} aria-hidden="true" />Kecamatan/UPZIS</label>
                <select id="doc-kecamatan" value={filters.kecamatan} onChange={(event) => changeFilter('kecamatan', event.target.value)}>
                  <option value="all">Semua Kecamatan</option>
                  {options.kecamatan.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="pjm-filter">
                <label className="pjm-filter-label" htmlFor="doc-village"><Map size={14} aria-hidden="true" />Desa/Ranting</label>
                <select id="doc-village" value={filters.village} onChange={(event) => changeFilter('village', event.target.value)}>
                  <option value="all">Semua Desa</option>
                  {options.villages.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="gorut-documents-filter-footer">
                <span>{filtersActive ? `${formatNumber(filtered.length)} dokumen cocok dengan filter aktif` : 'Filter menampilkan seluruh dokumen yang dapat diturunkan dari data existing.'}</span>
                <button type="button" className="gorut-collect-reset" onClick={resetFilters} disabled={!filtersActive}>Reset Filter</button>
              </div>
            </section>

            <section className="pjm-summary gorut-documents-summary" aria-label="Ringkasan dokumen">
              <article>
                <div className="pjm-summary-heading"><span><FileText size={15} aria-hidden="true" /></span><p>Total Dokumen</p></div>
                <strong>{formatNumber(summary.total)}</strong>
                <small>Dari filter aktif</small>
              </article>
              <article className="is-highlighted">
                <div className="pjm-summary-heading"><span><CheckCircle2 size={15} aria-hidden="true" /></span><p>Siap Dilihat</p></div>
                <strong>{formatNumber(summary.ready)}</strong>
                <small>Preview HTML tersedia</small>
              </article>
              <article>
                <div className="pjm-summary-heading"><span><Hourglass size={15} aria-hidden="true" /></span><p>Menunggu Data</p></div>
                <strong>{formatNumber(summary.waiting)}</strong>
                <small>Belum memenuhi syarat</small>
              </article>
              <article>
                <div className="pjm-summary-heading"><span><Ban size={15} aria-hidden="true" /></span><p>Belum Tersedia</p></div>
                <strong>{formatNumber(summary.unavailable)}</strong>
                <small>Termasuk F.016 scaffold</small>
              </article>
            </section>

            <p className="gorut-collect-readonly-note gorut-documents-note">
              <Info size={14} aria-hidden="true" />
              Dokumen pada halaman ini masih menggunakan preview frontend. Penyimpanan PDF dan pencetakan resmi akan tersedia setelah layanan dokumen diaktifkan.
            </p>

            <section className="pjm-panel gorut-collect-panel gorut-documents-panel">
              <header className="pjm-toolbar gorut-documents-toolbar">
                <label className="pjm-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    value={filters.query}
                    onChange={(event) => changeFilter('query', event.target.value)}
                    placeholder="Cari nomor dokumen, PLPK, desa/ranting, atau UPZIS"
                    aria-label="Cari nomor dokumen, PLPK, desa/ranting, atau UPZIS"
                  />
                </label>

                <div className="pjm-toolbar-actions gorut-documents-toolbar-actions">
                  <label className="gorut-documents-ready-filter">
                    <ListFilter size={15} aria-hidden="true" />
                    <span>Kesiapan</span>
                    <select value={filters.readiness} onChange={(event) => changeFilter('readiness', event.target.value)} aria-label="Filter kesiapan dokumen">
                      <option value="all">Semua Kesiapan</option>
                      {(Object.keys(documentReadinessLabels) as DocumentReadiness[]).map((key) => (
                        <option key={key} value={key}>{documentReadinessLabels[key]}</option>
                      ))}
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
                </div>
              </header>

              {pageRows.length === 0 ? (
                <div className="gorut-collect-empty">
                  <SearchX size={28} />
                  <h2>Belum ada dokumen yang cocok</h2>
                  <p>{filtersActive ? 'Ubah kata kunci atau reset filter untuk melihat data lainnya.' : 'Belum ada batch atau rekap yang dapat diturunkan menjadi dokumen.'}</p>
                  {filtersActive ? <button type="button" className="gorut-button gorut-secondary-button" onClick={resetFilters}>Reset Filter</button> : null}
                </div>
              ) : (
                <>
                  <div className="pjm-table-wrap gorut-documents-table-wrap">
                    <table className="pjm-table gorut-documents-table">
                      <thead>
                        <tr>
                          <th>Jenis</th>
                          <th>Nomor / Identitas</th>
                          <th>Periode</th>
                          <th>Wilayah</th>
                          <th>Pemilik / Petugas</th>
                          <th>Status Data</th>
                          <th>Status Dokumen</th>
                          <th>Diperbarui</th>
                          <th className="is-action">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row) => (
                          <tr key={row.id} className={row.readiness === 'unavailable' ? 'is-unavailable' : row.readiness === 'waiting' ? 'is-waiting' : undefined}>
                            <td><strong>{row.kindLabel}</strong></td>
                            <td>
                              <strong className="pjm-code">{row.documentNumber}</strong>
                              <span className="pjm-name">{row.id.startsWith('f016') ? 'Scaffold — tanpa nomor palsu' : row.kind === 'f009' ? 'Per PLPK & periode' : 'Per desa/ranting & periode'}</span>
                            </td>
                            <td>{row.periodLabel}</td>
                            <td>
                              <strong>{row.village}</strong>
                              <small>{row.kecamatan}</small>
                            </td>
                            <td>{row.owner}</td>
                            <td>{row.dataStatus}</td>
                            <td className="is-status">
                              <span className={`pjm-badge gorut-documents-badge is-${row.readiness}`}>{row.readinessLabel}</span>
                            </td>
                            <td className="pjm-datetime">{row.updatedAt ? formatDateShort(row.updatedAt) : '—'}</td>
                            <td className="is-action">
                              <div className="gorut-documents-actions">
                                <button
                                  type="button"
                                  className="gorut-documents-action"
                                  disabled={!row.canPreview}
                                  title={row.canPreview ? 'Lihat preview sementara' : 'Preview belum siap'}
                                  onClick={() => openPreview(row)}
                                >
                                  <Eye size={14} aria-hidden="true" />Lihat Preview
                                </button>
                                <button type="button" className="gorut-documents-action" onClick={() => setDetail(row)}>
                                  <FileText size={14} aria-hidden="true" />Lihat Detail
                                </button>
                                <button type="button" className="gorut-documents-action is-disabled" disabled title="Belum tersedia">
                                  <Download size={14} aria-hidden="true" />Simpan PDF
                                </button>
                                <button type="button" className="gorut-documents-action is-disabled" disabled title="Segera tersedia">
                                  <Printer size={14} aria-hidden="true" />Cetak
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="gorut-documents-cards">
                    {pageRows.map((row) => (
                      <article key={`card-${row.id}`} className={row.readiness === 'unavailable' ? 'is-unavailable' : undefined}>
                        <header>
                          <div>
                            <strong className="pjm-code">{row.kindLabel}</strong>
                            <span className="pjm-name">{row.documentNumber}</span>
                          </div>
                          <span className={`pjm-badge gorut-documents-badge is-${row.readiness}`}>{row.readinessLabel}</span>
                        </header>
                        <dl>
                          <div><dt>Periode</dt><dd>{row.periodLabel}</dd></div>
                          <div><dt>Wilayah</dt><dd>{row.village} · {row.kecamatan}</dd></div>
                          <div className="is-wide"><dt>Pemilik</dt><dd>{row.owner}</dd></div>
                          <div className="is-wide"><dt>Status Data</dt><dd>{row.dataStatus}</dd></div>
                        </dl>
                        <footer>
                          <button type="button" className="gorut-documents-action" disabled={!row.canPreview} onClick={() => openPreview(row)}>
                            <Eye size={14} aria-hidden="true" />Preview
                          </button>
                          <button type="button" className="gorut-documents-action" onClick={() => setDetail(row)}>Detail</button>
                        </footer>
                      </article>
                    ))}
                  </div>

                  <footer className="gorut-collect-pagination">
                    <div className="gorut-pagination-info">
                      Menampilkan <strong>{(safePage - 1) * pageSize + 1}–{Math.min(filtered.length, safePage * pageSize)}</strong> dari <strong>{formatNumber(filtered.length)}</strong> dokumen
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

        {notice ? <div className="gorut-mobile-notice" role="status"><FileText size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />{notice}</div> : null}

        {detail ? (
          <div className="gorut-documents-detail-backdrop" role="presentation" onClick={() => setDetail(null)}>
            <aside className="gorut-documents-detail" role="dialog" aria-modal="true" aria-label="Detail dokumen" onClick={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <p>{detail.kindLabel}</p>
                  <h2>{detail.documentNumber}</h2>
                </div>
                <button type="button" className="gorut-documents-detail-close" onClick={() => setDetail(null)} aria-label="Tutup detail">×</button>
              </header>
              <dl>
                <div><dt>Periode</dt><dd>{detail.periodLabel}</dd></div>
                <div><dt>Wilayah</dt><dd>{detail.village}, {detail.kecamatan}</dd></div>
                <div><dt>Pemilik / Petugas</dt><dd>{detail.owner}</dd></div>
                <div><dt>Status Data</dt><dd>{detail.dataStatus}</dd></div>
                <div><dt>Status Dokumen</dt><dd>{detail.readinessLabel}</dd></div>
                <div><dt>Diperbarui</dt><dd>{detail.updatedAt ? formatDateShort(detail.updatedAt) : '—'}</dd></div>
              </dl>
              <p className="gorut-documents-detail-note">
                <FileWarning size={14} aria-hidden="true" />
                {detail.kind === 'f016'
                  ? 'F.016 belum memiliki builder atau sumber data executable di frontend. Nomor dokumen palsu tidak dibuat.'
                  : 'Ini ringkasan metadata dokumen. Preview HTML fallback tersedia bila status Siap Dilihat. PDF resmi belum diaktifkan.'}
              </p>
              <footer>
                <button type="button" className="gorut-button gorut-secondary-button" onClick={() => setDetail(null)}>Tutup</button>
                <button
                  type="button"
                  className="gorut-button gorut-primary-button"
                  disabled={!detail.canPreview}
                  onClick={() => { openPreview(detail); setDetail(null); }}
                >
                  Lihat Preview
                </button>
                <Link href="/gorut-v2/penghimpunan/verifikasi-kordes" className="gorut-button gorut-secondary-button">Ke Verifikasi Kordes</Link>
              </footer>
            </aside>
          </div>
        ) : null}

        <F009Preview batch={previewBatch} canPrint={false} onClose={() => setPreview(null)} />
        <KordesDocumentViewer
          documentType={preview?.kind === 'f010' || preview?.kind === 'f015' ? preview.kind : 'f010'}
          recap={previewRecap}
          batches={batches}
          canPrint={false}
          onClose={() => setPreview(null)}
        />
      </div>
    </div>
  );
}
