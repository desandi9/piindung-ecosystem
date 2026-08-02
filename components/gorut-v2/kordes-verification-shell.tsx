'use client';

import { AlertTriangle, Banknote, CheckCircle2, Clock3, Eye, FileText, Filter, MapPin, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { KordesDocumentViewer } from '@/components/gorut-v2/documents/kordes-document-viewer';
import { F009Preview } from '@/components/gorut-v2/pengambilan/f009-preview';
import { VerificationWizard } from '@/components/gorut-v2/kordes-verification-form';
import { saveCollectionBatch } from '@/features/gorut-v2/collection-store';
import { formatDateShort, formatRupiah } from '@/features/gorut-v2/formatters';
import { applyKordesDecision } from '@/features/gorut-v2/kordes-mobile';
import { buildKordesVerifications, createVillageRecaps, getBatch, isF015Ready, summarizeVillageRecap } from '@/features/gorut-v2/kordes-mock-data';
import { useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';
import type { F015Status, KordesVerification, KordesVerificationStatus, KordesVillageRecap } from '@/features/gorut-v2/types';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';
import { GorutSidebar } from './gorut-sidebar';
import { MobileSidebar } from './mobile-sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { GorutHeader } from './gorut-header';
import { PenghimpunanTabs } from './penghimpunan-tabs';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };
const verificationLabels: Record<KordesVerificationStatus, string> = {
  'waiting-kordes-verification': 'Menunggu Verifikasi Kordes',
  'verified-by-kordes': 'Terverifikasi Kordes',
  'needs-correction': 'Perlu Koreksi',
};

const f015Labels: Record<F015Status, string> = {
  'not-ready': 'Belum Siap',
  'waiting-plpk-completion': 'Menunggu Kelengkapan PLPK',
  'ready-to-create': 'Siap Dibuat',
  'f015-ready': 'F.015 Siap',
  'waiting-upzis-handover': 'F.015 Siap',
  'handed-to-upzis': 'F.015 Selesai',
};

const actionLabels: Record<KordesVerificationStatus, string> = {
  'waiting-kordes-verification': 'Verifikasi Data',
  'verified-by-kordes': 'Lihat Hasil Verifikasi',
  'needs-correction': 'Lihat Hasil Verifikasi',
};

function recapCompleteness(recap: KordesVillageRecap): string {
  if (recap.f015Status === 'handed-to-upzis') return 'F.015 Selesai';
  if (recap.f015Status === 'waiting-upzis-handover') return 'F.015 Siap';
  if (recap.f015Status === 'f015-ready') return 'F.015 Siap';
  if (!isF015Ready(recap)) return 'Belum Lengkap';
  if (recap.plpkRows.some((row) => row.status === 'needs-correction')) return 'Perlu Koreksi';
  return 'Siap Membuat F.015';
}
function StatusBadge({ value, tone }: { value: string; tone: string }) {
  return <span className={`kordes-status is-${tone}`}>{value}</span>;
}
export function KordesVerificationShell() {
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const batches = useCollectionBatches();
  const [activeTab, setActiveTab] = useState<'plpk' | 'village'>('plpk');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detail, setDetail] = useState<KordesVerification | null>(null);
  const [wizard, setWizard] = useState<KordesVerification | null>(null);
  const [f009Preview, setF009Preview] = useState<KordesVerification | null>(null);
  const [villageDetail, setVillageDetail] = useState<KordesVillageRecap | null>(null);
  const [documentPreview, setDocumentPreview] = useState<{ type: 'f010' | 'f015'; recap: KordesVillageRecap } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const triggerNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  const rows = useMemo(() => buildKordesVerifications(batches), [batches]);

  const recaps = useMemo(() => createVillageRecaps(rows), [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (statusFilter === 'all' || row.status === statusFilter) &&
          `${row.plpkName} ${row.plpkId} ${row.village} ${row.kecamatan} ${row.period}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [rows, statusFilter, query],
  );

  const summary = useMemo(
    () => ({
      waiting: rows.filter((row) => row.status === 'waiting-kordes-verification').length,
      verified: rows.filter((row) => row.status === 'verified-by-kordes').length,
      corrections: rows.filter((row) => row.status === 'needs-correction').length,
      totalNet: rows.reduce((sum, row) => sum + row.netAmount, 0),
    }),
    [rows],
  );

  const villageSummary = useMemo(
    () => ({
      waiting: recaps.filter((r) => r.f015Status === 'waiting-plpk-completion').length,
      ready: recaps.filter((r) => ['ready-to-create', 'f015-ready'].includes(r.f015Status)).length,
      f015Ready: recaps.filter((r) => r.f015Status === 'waiting-upzis-handover' || r.f015Status === 'f015-ready').length,
      totalNet: recaps.reduce((sum, r) => sum + summarizeVillageRecap(r).netAmount, 0),
    }),
    [recaps],
  );

  const updateRow = (next: KordesVerification) => {
    const source = batches.find((batch) => batch.id === next.batchId);
    if (source) {
      const decidedAt = next.verifiedAt ?? next.returnedForCorrectionAt ?? new Date().toISOString();
      const action = next.status === 'verified-by-kordes' ? 'verify' : 'correction';
      const result = applyKordesDecision(source, {
        moneyMatches: next.moneyMatches,
        hasDamagedMoney: next.hasDamagedMoney,
        cashReceived: next.cashReceived,
        notes: next.notes,
        correctionEntryIds: action === 'correction' ? next.correctionEntryIds : undefined,
      }, action, next.verifiedByKordesName ?? next.kordesName, decidedAt);
      if (result.error || !result.batch) {
        triggerNotice(result.error ?? 'Keputusan verifikasi gagal disimpan.');
        return;
      }
      saveCollectionBatch(result.batch);
    }
    setWizard(null);
    setDetail(next);
  };

  return (
    <div className="gorut-viewport">
      {loading ? (
        <div className="gorut-app">
          <GorutSidebar target={target} />
          <div className="gorut-workspace">
            <GorutHeader title="Penghimpunan" onMenuOpen={() => setMobileMenu(true)} />
            <main className="gorut-main">
              <div className="gorut-placeholder-skeleton" />
            </main>
          </div>
        </div>
      ) : (
        <div className="gorut-app">
          <GorutSidebar target={target} />

          <div className="gorut-workspace">
            <GorutHeader title="Penghimpunan" onMenuOpen={() => setMobileMenu(true)} />

            <main className="gorut-main gorut-collect-main">
              <PenghimpunanTabs />

              <div className="kordes-shell">
                <div className="gorut-collect-heading">
                  <div>
                    <p>PENGHIMPUNAN</p>
                    <h1>Verifikasi Kordes</h1>
                      <span>Periksa hasil penjemputan PLPK yang sudah dikonfirmasi, lalu verifikasi kesesuaian data penghimpunan pada tingkat ranting/desa.</span>
                  </div>
                </div>
                 <div className="kordes-tabs" role="tablist" aria-label="Tahap verifikasi Kordes">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'plpk'}
                    className={activeTab === 'plpk' ? 'is-active' : ''}
                    onClick={() => setActiveTab('plpk')}
                  >
                    Verifikasi PLPK
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'village'}
                    className={activeTab === 'village' ? 'is-active' : ''}
                    onClick={() => setActiveTab('village')}
                  >
                    Rekap Desa &amp; Dokumen
                  </button>
                </div>
                {activeTab === 'plpk' && (
                  <>
                    <div className="kordes-summary">
                      <article>
                        <div><Clock3 size={15} /><span>Menunggu Verifikasi</span></div>
                        <strong>{summary.waiting}</strong>
                      </article>
                      <article>
                        <div><CheckCircle2 size={15} /><span>Terverifikasi Kordes</span></div>
                        <strong>{summary.verified}</strong>
                      </article>
                      <article>
                        <div><Banknote size={15} /><span>Jumlah Bersih</span></div>
                        <strong>{formatRupiah(summary.totalNet)}</strong>
                      </article>
                      <article>
                        <div><AlertTriangle size={15} /><span>Perlu Koreksi</span></div>
                        <strong>{summary.corrections}</strong>
                      </article>
                    </div>

                    <PlpkFilterBar
                      query={query}
                      setQuery={setQuery}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      filtersOpen={filtersOpen}
                      setFiltersOpen={setFiltersOpen}
                      rows={rows}
                    />

                    <PlpkTable
                      rows={filtered}
                      onDetail={(row) => setDetail(row)}
                    />
                  </>
                )}
                {activeTab === 'village' && (
                  <VillageTab
                    recaps={recaps}
                    villageSummary={villageSummary}
                    onDetail={(r) => setVillageDetail(r)}
                    onF010={(recap) => setDocumentPreview({ type: 'f010', recap })}
                    onF015={(recap) => setDocumentPreview({ type: 'f015', recap })}
                  />
                )}
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

          <MobileBottomNav
            navigation={mobileNavigation}
            onMore={() => setMobileMenu(true)}
            onUnavailable={(label) => triggerNotice(`${label}: Segera tersedia`)}
          />

          {notice && (
            <div className="gorut-mobile-notice" role="status">
              {notice}
            </div>
          )}

          <PlpkDetailDrawer
            item={detail}
            onClose={() => setDetail(null)}
            onVerify={() => { if (detail) setWizard(detail); }}
            onF009={() => { if (detail) setF009Preview(detail); }}
          />

          <VerificationWizard
            item={wizard}
            onClose={() => setWizard(null)}
            onSave={updateRow}
          />

          <VillageDrawer
            item={villageDetail}
            onClose={() => setVillageDetail(null)}
            onF010={() => { if (villageDetail) setDocumentPreview({ type: 'f010', recap: villageDetail }); }}
            onF015={() => { if (villageDetail) setDocumentPreview({ type: 'f015', recap: villageDetail }); }}
          />

          <KordesDocumentViewer
            documentType={documentPreview?.type ?? 'f010'}
            recap={documentPreview?.recap ?? null}
            batches={batches}
            onClose={() => setDocumentPreview(null)}
          />

          <F009Preview
            batch={f009Preview ? getBatch(f009Preview.batchId) : null}
            onClose={() => setF009Preview(null)}
          />
        </div>
      )}
    </div>
  );
}
function PlpkFilterBar({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  filtersOpen,
  setFiltersOpen,
  rows,
}: {
  query: string;
  setQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
  rows: KordesVerification[];
}) {
  const villages = useMemo(() => Array.from(new Set(rows.map((r) => r.village))), [rows]);
  return (
    <div className="kordes-filter-card">
      <button
        type="button"
        className="gorut-button gorut-secondary-button kordes-filter-toggle"
        onClick={() => setFiltersOpen(!filtersOpen)}
      >
        <Filter size={14} />
        Filter
      </button>
      <div className={`kordes-filter-body${filtersOpen ? ' is-open' : ''}`}>
        <label className="gorut-collect-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari PLPK, ID, desa, periode"
          />
        </label>
        <div className="gorut-collect-selects">
          <label>
            <select defaultValue="all">
              <option value="all">Semua Periode</option>
              <option>2026-07</option>
              <option>2026-06</option>
              <option>2026-05</option>
            </select>
          </label>
          <label>
            <select defaultValue="all">
              <option value="all">Semua Kecamatan</option>
              <option>Garut Kota</option>
              <option>Tarogong Kidul</option>
              <option>Karangpawitan</option>
            </select>
          </label>
          <label>
            <select defaultValue="all">
              <option value="all">Semua Desa/Ranting</option>
              {villages.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status Verifikasi</option>
              {Object.entries(verificationLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
function PlpkTable({
  rows,
  onDetail,
}: {
  rows: KordesVerification[];
  onDetail: (row: KordesVerification) => void;
}) {
  return (
    <div className="gorut-collect-panel kordes-panel">
      <div className="gorut-collect-table-wrap">
        <table className="kordes-table">
          <thead>
            <tr>
              <th>PLPK</th>
              <th>Wilayah</th>
              <th>Periode</th>
              <th>Kaleng Terjemput</th>
              <th>Kaleng Tidak Terjemput</th>
              <th>Jumlah Kotor</th>
              <th>Bisyaroh PLPK</th>
              <th>Jumlah Bersih</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const batch = getBatch(row.batchId);
              return (
                <tr key={row.id}>
                  <td>
                    <strong>{row.plpkName}</strong>
                    <small>{row.plpkId}</small>
                  </td>
                  <td>
                    <strong>{row.village}</strong>
                    <small>{row.kecamatan}</small>
                  </td>
                  <td>{row.period}</td>
                  <td>{batch.collectedCanCount}</td>
                  <td>{batch.uncollectedCanCount}</td>
                  <td className="is-money">{formatRupiah(row.grossAmount)}</td>
                  <td className="is-money">{formatRupiah(row.totalPlpkFee)}</td>
                  <td className="is-money">{formatRupiah(row.netAmount)}</td>
                  <td>
                    <StatusBadge value={verificationLabels[row.status]} tone={row.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="gorut-button gorut-secondary-button kordes-row-button"
                      onClick={() => onDetail(row)}
                    >
                      <Eye size={14} />
                      {actionLabels[row.status]}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="gorut-collect-mobile-list">
        {rows.map((row) => {
          const batch = getBatch(row.batchId);
          return (
            <article key={row.id}>
              <div className="gorut-collect-card-top">
                <div>
                  <strong>{row.plpkName}</strong>
                  <small>{row.plpkId} · {row.village}</small>
                </div>
                <StatusBadge value={verificationLabels[row.status]} tone={row.status} />
              </div>
              <dl>
                <div><dt>Periode</dt><dd>{row.period}</dd></div>
                <div><dt>Kaleng Terjemput</dt><dd>{batch.collectedCanCount}</dd></div>
                <div><dt>Kaleng Tidak Terjemput</dt><dd>{batch.uncollectedCanCount}</dd></div>
                <div><dt>Jumlah Kotor</dt><dd>{formatRupiah(row.grossAmount)}</dd></div>
                <div><dt>Bisyaroh PLPK</dt><dd>{formatRupiah(row.totalPlpkFee)}</dd></div>
                <div><dt>Jumlah Bersih</dt><dd>{formatRupiah(row.netAmount)}</dd></div>
              </dl>
              <button
                type="button"
                className="gorut-button gorut-secondary-button"
                onClick={() => onDetail(row)}
              >
                <Eye size={14} />
                {actionLabels[row.status]}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
function VillageTab({
  recaps,
  villageSummary,
  onDetail,
  onF010,
  onF015,
}: {
  recaps: KordesVillageRecap[];
  villageSummary: { waiting: number; ready: number; f015Ready: number; totalNet: number };
  onDetail: (r: KordesVillageRecap) => void;
  onF010: (r: KordesVillageRecap) => void;
  onF015: (r: KordesVillageRecap) => void;
}) {
  return (
    <>
      <div className="kordes-village-heading">
        <div>
          <h2>Rekap Desa &amp; Dokumen Resmi</h2>
          <p>Periksa rekap PLPK melalui F.010 dan berita acara serah terima melalui F.015.</p>
        </div>
      </div>
      <div className="kordes-summary">
        <article>
          <div><Clock3 size={15} /><span>Desa Menunggu Kelengkapan</span></div>
          <strong>{villageSummary.waiting}</strong>
        </article>
        <article>
          <div><MapPin size={15} /><span>Desa Siap F.015</span></div>
          <strong>{villageSummary.ready}</strong>
        </article>
        <article>
          <div><FileText size={15} /><span>F.015 Siap</span></div>
          <strong>{villageSummary.f015Ready}</strong>
        </article>
        <article>
          <div><Banknote size={15} /><span>Total Uang Tingkat Desa</span></div>
          <strong>{formatRupiah(villageSummary.totalNet)}</strong>
        </article>
      </div>
      <div className="gorut-collect-panel kordes-panel">
        <div className="gorut-collect-table-wrap">
          <table className="kordes-table kordes-village-table">
            <thead>
              <tr>
                <th>Desa/Ranting</th>
                <th>Periode</th>
                <th>Jumlah PLPK</th>
                <th>Kaleng Aktif</th>
                <th>Terjemput</th>
                <th>Tidak Terjemput</th>
                <th>Jumlah Kotor</th>
                <th>Total Bisyaroh</th>
                <th>Jumlah Bersih</th>
                <th>Status Rekap</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {recaps.map((recap) => {
                const total = summarizeVillageRecap(recap);
                const ready = isF015Ready(recap);
                return (
                  <tr key={recap.id}>
                    <td><strong>{recap.village}</strong><small>{recap.kecamatan}</small></td>
                    <td>{recap.period}</td>
                    <td>{total.plpkCount}</td>
                    <td>{total.activeCanCount}</td>
                    <td>{total.collectedCanCount}</td>
                    <td>{total.uncollectedCanCount}</td>
                    <td className="is-money">{formatRupiah(total.grossAmount)}</td>
                    <td className="is-money">{formatRupiah(total.totalPlpkFee)}</td>
                    <td className="is-money">{formatRupiah(total.netAmount)}</td>
                    <td><StatusBadge value={recapCompleteness(recap)} tone={ready ? 'verified-by-kordes' : 'waiting-plpk-completion'} /></td>
                    <td>
                      <div className="kordes-village-actions">
                        <button
                          type="button"
                          className="gorut-button gorut-secondary-button"
                          onClick={() => onDetail(recap)}
                        >
                          Lihat Detail Rekap
                        </button>
                        <button
                          type="button"
                          className="gorut-button gorut-secondary-button"
                          onClick={() => onF010(recap)}
                        >
                          <Eye size={13} />
                          Lihat F.010
                        </button>
                        {ready ? (
                          <>
                            <button
                              type="button"
                              className="gorut-button gorut-primary-button"
                              onClick={() => onF015(recap)}
                            >
                              <Eye size={13} />
                              Lihat F.015
                            </button>

                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="gorut-button gorut-primary-button"
                              disabled={!ready}
                              title="Seluruh PLPK harus selesai diverifikasi."
                            >
                              Buat F.015
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="gorut-collect-mobile-list">
          {recaps.map((recap) => {
            const total = summarizeVillageRecap(recap);
            const verifiedCount = recap.plpkRows.filter((r) => r.status === 'verified-by-kordes').length;
            const ready = isF015Ready(recap);
            return (
              <article key={recap.id}>
                <div className="gorut-collect-card-top">
                  <div>
                    <strong>{recap.village}</strong>
                    <small>{recap.period} · {recap.kecamatan}</small>
                  </div>
                  <StatusBadge
                    value={recapCompleteness(recap)}
                    tone={ready ? 'verified' : 'waiting-plpk-completion'}
                  />
                </div>
                <dl>
                  <div><dt>PLPK</dt><dd>{verifiedCount}/{total.plpkCount} terverifikasi</dd></div>
                  <div><dt>Jumlah Bersih</dt><dd>{formatRupiah(total.netAmount)}</dd></div>
                  <div><dt>Status F.015</dt><dd>{f015Labels[recap.f015Status]}</dd></div>
                </dl>
                <div className="kordes-mobile-actions">
                  <button
                    type="button"
                    className="gorut-button gorut-secondary-button"
                    onClick={() => onDetail(recap)}
                  >
                    Lihat Rekap
                  </button>
                  <button
                    type="button"
                    className="gorut-button gorut-secondary-button"
                    onClick={() => onF010(recap)}
                  >
                    <Eye size={13} />
                    F.010
                  </button>
                  <button
                    type="button"
                    className="gorut-button gorut-primary-button"
                    disabled={!ready}
                    onClick={() => { if (ready) onF015(recap); }}
                  >
                    <Eye size={13} />
                    Lihat F.015
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
function PlpkDetailDrawer({
  item,
  onClose,
  onVerify,
  onF009,
}: {
  item: KordesVerification | null;
  onClose: () => void;
  onVerify: () => void;
  onF009: () => void;
}) {
  if (!item) return null;
  const batch = getBatch(item.batchId);
  const canVerify = item.status === 'waiting-kordes-verification';
  const decisionAt = item.status === 'needs-correction' ? item.returnedForCorrectionAt : item.verifiedAt;
  const decisionDateLabel = item.status === 'needs-correction' ? 'Tanggal Dikembalikan' : 'Tanggal Verifikasi';
  return (
    <aside className="kordes-drawer" aria-label="Detail Verifikasi PLPK">
      <button type="button" className="kordes-close" onClick={onClose}><X size={18} /></button>

      <div className="kordes-drawer-head">
        <div>
          <p>DETAIL VERIFIKASI PLPK</p>
          <h2>{item.plpkName}</h2>
          <span>{item.plpkId} · {item.village}, {item.kecamatan}</span>
        </div>
        <StatusBadge value={verificationLabels[item.status]} tone={item.status} />
      </div>

      <div className="kordes-drawer-body">
        <div className="kordes-drawer-section">
          <h3>Dokumen sumber</h3>
          <div className="kordes-source-row">
            <div className="kordes-info-grid">
              <div><dt>Nomor F.009</dt><dd>{item.f009DocumentNumber}</dd></div>
              <div><dt>Periode</dt><dd>{item.period}</dd></div>
              <div><dt>Tanggal Penjemputan</dt><dd>{formatDateShort(batch.createdAt)}</dd></div>
            </div>
            <button type="button" className="gorut-button gorut-secondary-button" onClick={onF009}>
              <FileText size={14} />Lihat F.009
            </button>
          </div>
        </div>

        <div className="kordes-drawer-section">
          <h3>Ringkasan penghimpunan</h3>
          <div className="kordes-highlight">
            <article>
              <span>Jumlah Kotor</span>
              <strong>{formatRupiah(item.grossAmount)}</strong>
            </article>
            <article>
              <span>Bisyaroh PLPK</span>
              <strong>{formatRupiah(item.totalPlpkFee)}</strong>
            </article>
            <article className="is-primary">
              <span>Jumlah Bersih yang Harus Diterima Kordes</span>
              <strong>{formatRupiah(item.netAmount)}</strong>
            </article>
          </div>
        </div>

        <div className="kordes-drawer-section">
          <h3>Hasil verifikasi</h3>
          <div className="kordes-info-grid">
            <div><dt>Jumlah Uang Sesuai</dt><dd>{item.moneyMatches === undefined ? '—' : item.moneyMatches ? 'Ya' : 'Tidak'}</dd></div>
            <div><dt>Ada Uang Rusak</dt><dd>{item.hasDamagedMoney === undefined ? '—' : item.hasDamagedMoney ? 'Ya' : 'Tidak'}</dd></div>
            <div><dt>Uang Sudah Diterima</dt><dd>{item.cashReceived === undefined ? '—' : item.cashReceived ? 'Ya' : 'Tidak'}</dd></div>
            <div><dt>{decisionDateLabel}</dt><dd>{decisionAt ? formatDateShort(decisionAt) : '—'}</dd></div>
            <div><dt>Nama Kordes</dt><dd>{item.verifiedByKordesName ?? '—'}</dd></div>
          </div>
        </div>

        <div className="kordes-drawer-section">
          <h3>Catatan dan keputusan</h3>
          <div className="kordes-info-grid">
            <div><dt>Catatan</dt><dd>{item.notes ?? '—'}</dd></div>
            <div>
              <dt>Riwayat Keputusan</dt>
              <dd>
                {decisionAt
                  ? `${formatDateShort(decisionAt)} · ${verificationLabels[item.status]}`
                  : 'Belum ada keputusan'}
              </dd>
            </div>
          </div>
        </div>
      </div>

      <div className="kordes-drawer-footer">
        <button type="button" className="gorut-button gorut-secondary-button" onClick={onF009}>
          <Eye size={14} />Lihat F.009
        </button>
        {canVerify ? (
          <button type="button" className="gorut-button gorut-primary-button" onClick={onVerify}>
            Verifikasi Data
          </button>
        ) : (
          <button type="button" className="gorut-button gorut-secondary-button" disabled>
            {actionLabels[item.status]}
          </button>
        )}
      </div>
    </aside>
  );
}

function VillageDrawer({
  item,
  onClose,
  onF010,
  onF015,
}: {
  item: KordesVillageRecap | null;
  onClose: () => void;
  onF010: () => void;
  onF015: () => void;
}) {
  if (!item) return null;
  const total = summarizeVillageRecap(item);
  const ready = isF015Ready(item);

  return (
    <aside className="kordes-drawer kordes-recap-drawer" aria-label="Rekap Desa">
      <button type="button" className="kordes-close" onClick={onClose}><X size={18} /></button>

      <div className="kordes-drawer-head">
        <div>
          <p>REKAP TINGKAT DESA</p>
          <h2>{item.village}</h2>
          <span>{item.kecamatan} · {item.period}</span>
        </div>
        <StatusBadge value={recapCompleteness(item)} tone={ready ? 'verified' : 'waiting-plpk-completion'} />
      </div>

      <div className="kordes-drawer-body kordes-recap-body">
        <div className="kordes-village-table-wrap">
          <table className="kordes-inner-table">
            <thead>
              <tr>
                <th>PLPK</th>
                <th>Kaleng</th>
                <th>Bruto</th>
                <th>Upah</th>
                <th>Bersih</th>

                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {item.plpkRows.map((row) => {
                const batch = getBatch(row.batchId);
                return (
                  <tr key={row.id}>
                    <td>{row.plpkName}<small>{row.plpkId}</small></td>
                    <td>{batch.collectedCanCount}/{batch.activeCanCount}</td>
                    <td>{formatRupiah(row.grossAmount)}</td>
                    <td>{formatRupiah(row.totalPlpkFee)}</td>
                    <td>{formatRupiah(row.netAmount)}</td>

                    <td>{verificationLabels[row.status]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="kordes-recap-totals">
          <h3>Ringkasan desa</h3>
          <div className="kordes-info-grid">
            {([
              ['Jumlah PLPK', total.plpkCount],
              ['Total Kaleng Aktif', total.activeCanCount],
              ['Total Kaleng Terjemput', total.collectedCanCount],
              ['Total Tidak Terjemput', total.uncollectedCanCount],
              ['Total Jumlah Kotor', formatRupiah(total.grossAmount)],
              ['Total Upah PLPK', formatRupiah(total.totalPlpkFee)],
              ['Total Jumlah Bersih', formatRupiah(total.netAmount)],

              ['Nomor F.015', item.f015Number],
              ['Status Kelengkapan', ready ? 'Lengkap' : 'Belum lengkap'],
              ['Status F.015', f015Labels[item.f015Status]],
            ] as [string, string | number][]).map(([key, val]) => (
              <div key={key}><dt>{key}</dt><dd>{val}</dd></div>
            ))}
          </div>
        </div>
      </div>

      <div className="kordes-drawer-footer">
        <button type="button" className="gorut-button gorut-secondary-button" onClick={onClose}>
          Tutup
        </button>
        <button type="button" className="gorut-button gorut-secondary-button" onClick={onF010}>
          <Eye size={14} />Lihat F.010
        </button>
        {ready && (
          <button type="button" className="gorut-button gorut-primary-button" onClick={onF015}>
            <Eye size={14} />Lihat F.015
          </button>
        )}

      </div>
    </aside>
  );
}
