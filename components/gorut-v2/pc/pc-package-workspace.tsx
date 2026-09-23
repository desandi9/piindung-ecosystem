'use client';

import { AlertTriangle, Banknote, CheckCircle2, Clock3, Eye, FileClock, Info, RefreshCw, Rows3, Search, SearchX, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { GorutPackageDetail, GorutPackageSummary, GorutSettlementEvidence, PackageSettlementCommand } from '@/features/gorut-v2/package-api-client';
import {
  formatCanonicalRupiah,
  formatPackageTimestamp,
  formatSignedCanonicalRupiah,
  isProvisionalFeePolicy,
  packageBlockingReasonLabel,
  packageFinancialLabel,
  packageStateLabel,
  packageStatusTone,
} from '@/features/gorut-v2/package-api-view-model';
import { usePackageApi } from '@/features/gorut-v2/use-package-api';

import { GorutAppShell } from '../gorut-app-shell';
import { OperationEmptyState, OperationErrorState, OperationLoadingState } from '../operations/operation-states';
import { OperationPageHeader } from '../operations/operation-page-header';
import { SummaryBand, type SummaryMetric } from '../operations/summary-band';

export type PcWorkspaceMode = 'setoran' | 'validasi' | 'approval';

type Filters = { period: string; kecamatan: string; state: string; readiness: string };
const initialFilters: Filters = { period: 'all', kecamatan: 'all', state: 'all', readiness: 'all' };

const modeCopy = {
  setoran: {
    title: 'Setoran',
    description: 'Catat dan baca evidence serah-terima package Kecamatan berdasarkan fakta settlement server.',
    note: 'Package adalah aggregate settlement. Expected berasal dari Jumlah Bersih server; evidence tidak mengubah state workflow.',
  },
  validasi: {
    title: 'Validasi Setoran',
    description: 'Periksa evidence settlement aktif dan rekam hasil validasi authoritative dari server.',
    note: 'Result MATCHED atau MISMATCH dihitung server dari evidence aktif. Halaman ini tidak melakukan RETURN atau final approval.',
  },
  approval: {
    title: 'Approval',
    description: 'Tinjau financial, settlement, dan validation sebelum keputusan final PC.',
    note: 'APPROVE hanya tersedia dari availableActions server. FINAL_APPROVED bukan bukti bank settled, dana cleared, atau FINAL_CLOSE.',
  },
} as const;

export function PcPackageWorkspace({ mode }: { mode: PcWorkspaceMode }) {
  const copy = modeCopy[mode];
  const api = usePackageApi({ page: 1, pageSize: 100, states: ['WAITING_PC_APPROVAL', 'FINAL_APPROVED'] });
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const ordered = useMemo(() => [...api.packages].sort((left, right) => priority(mode, left) - priority(mode, right)), [api.packages, mode]);
  const options = useMemo(() => ({
    periods: [...new Set(ordered.map((item) => item.period.key))].sort().reverse(),
    kecamatan: [...new Set(ordered.map((item) => item.region.kecamatan.name))].sort((a, b) => a.localeCompare(b, 'id-ID')),
  }), [ordered]);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('id-ID');
    return ordered.filter((item) => {
      if (search && ![item.identity.packageCode, item.region.kecamatan.name, item.settlement.latest?.evidenceCode ?? ''].join(' ').toLocaleLowerCase('id-ID').includes(search)) return false;
      if (filters.period !== 'all' && item.period.key !== filters.period) return false;
      if (filters.kecamatan !== 'all' && item.region.kecamatan.name !== filters.kecamatan) return false;
      if (filters.state !== 'all' && item.workflow.currentState !== filters.state) return false;
      if (filters.readiness !== 'all' && readinessValue(mode, item) !== filters.readiness) return false;
      return true;
    });
  }, [filters, mode, ordered, query]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const filtersActive = query.trim().length > 0 || Object.values(filters).some((value) => value !== 'all');
  const detail = api.detail?.identity.packageCode === selectedCode ? api.detail : null;

  const metrics = useMemo<SummaryMetric[]>(() => {
    const waiting = api.packages.filter((item) => item.workflow.currentState === 'WAITING_PC_APPROVAL').length;
    const completed = api.packages.filter((item) => item.workflow.currentState === 'FINAL_APPROVED').length;
    if (mode === 'setoran') return [
      { id: 'queue', label: 'Menunggu Proses PC', value: String(waiting), detail: 'package authoritative', tone: waiting ? 'warning' : 'default', icon: <Clock3 size={18} /> },
      { id: 'recorded', label: 'Evidence Tercatat', value: String(api.packages.filter((item) => item.settlement.latest).length), detail: 'latest factual evidence', icon: <FileClock size={18} /> },
      { id: 'pickup', label: 'Dapat Dicatat PC', value: String(api.packages.filter((item) => item.settlement.availableActions.includes('RECORD_PC_PICKUP')).length), detail: 'capability server', icon: <Banknote size={18} /> },
      { id: 'history', label: 'Final Read-only', value: String(completed), detail: 'FINAL_APPROVED', tone: 'positive', icon: <CheckCircle2 size={18} /> },
    ];
    if (mode === 'validasi') return [
      { id: 'queue', label: 'Perlu Validasi', value: String(api.packages.filter((item) => item.settlement.validation.status !== 'CURRENT').length), detail: 'NOT_VALIDATED / STALE', tone: 'warning', icon: <Clock3 size={18} /> },
      { id: 'action', label: 'Dapat Divalidasi', value: String(api.packages.filter((item) => item.settlement.validation.availableActions.includes('VALIDATE_SETTLEMENT')).length), detail: 'capability server', icon: <ShieldCheck size={18} /> },
      { id: 'mismatch', label: 'Perlu Klarifikasi', value: String(api.packages.filter((item) => item.settlement.validation.result === 'MISMATCH').length), detail: 'MISMATCH current', tone: 'warning', icon: <AlertTriangle size={18} /> },
      { id: 'matched', label: 'Nominal Sesuai', value: String(api.packages.filter((item) => item.settlement.validation.result === 'MATCHED').length), detail: 'MATCHED current', tone: 'positive', icon: <CheckCircle2 size={18} /> },
    ];
    return [
      { id: 'queue', label: 'Menunggu Approval PC', value: String(waiting), detail: 'WAITING_PC_APPROVAL', tone: waiting ? 'warning' : 'default', icon: <Clock3 size={18} /> },
      { id: 'ready', label: 'Siap Disetujui', value: String(api.packages.filter((item) => item.settlement.finalApprovalReadiness.status === 'READY').length), detail: 'readiness server', tone: 'positive', icon: <ShieldCheck size={18} /> },
      { id: 'blocked', label: 'Masih Terblokir', value: String(api.packages.filter((item) => item.workflow.currentState === 'WAITING_PC_APPROVAL' && item.settlement.finalApprovalReadiness.status === 'BLOCKED').length), detail: 'lihat blocking reason', tone: 'warning', icon: <AlertTriangle size={18} /> },
      { id: 'approved', label: 'Disetujui PC', value: String(completed), detail: 'FINAL_APPROVED', tone: 'positive', icon: <CheckCircle2 size={18} /> },
    ];
  }, [api.packages, mode]);

  const openDetail = async (item: GorutPackageSummary) => {
    setSelectedCode(item.identity.packageCode);
    api.clearDetail();
    await api.loadDetail(item.identity.packageCode).catch(() => undefined);
    if (mode === 'setoran' && item.settlement.availableActions.includes('RECORD_PC_PICKUP')) {
      await api.loadSettlementParticipants(item.identity.packageCode).catch(() => undefined);
    }
  };

  const resetFilters = () => { setQuery(''); setFilters(initialFilters); setPage(1); };

  return (
    <GorutAppShell title={copy.title} loading={api.loading || api.detailLoading || api.hasPendingMutation}>
      <div className={`gorut-munfiq-workspace gorut-admin-workspace gorut-${mode}-workspace gorut-pc-package-workspace`}>
        <OperationPageHeader eyebrow="Operasional PC" title={copy.title} description={copy.description} meta={<span className="gorut-admin-source-pill"><ShieldCheck size={14} />Package API · authoritative</span>} />
        <SummaryBand metrics={metrics} label={`Ringkasan ${copy.title}`} />

        <section className={`gorut-operation-filters gorut-munfiq-filters gorut-admin-filters${filtersActive ? ' is-active' : ''}`} aria-labelledby={`${mode}-filter-title`}>
          <header><div><h2 id={`${mode}-filter-title`}>Filter Package</h2><p>Queue server WAITING_PC_APPROVAL dan history FINAL_APPROVED.</p></div><button type="button" onClick={resetFilters} disabled={!filtersActive}><RefreshCw size={14} />Reset</button></header>
          <div className="gorut-munfiq-filter-card"><div className="gorut-munfiq-selects gorut-admin-filter-grid">
            <Filter label="Periode" value={filters.period} onChange={(value) => { setFilters((current) => ({ ...current, period: value })); setPage(1); }} options={['all', ...options.periods]} optionLabel={(value) => value === 'all' ? 'Semua Periode' : ordered.find((item) => item.period.key === value)?.period.label ?? value} />
            <Filter label="Kecamatan / UPZIS" value={filters.kecamatan} onChange={(value) => { setFilters((current) => ({ ...current, kecamatan: value })); setPage(1); }} options={['all', ...options.kecamatan]} optionLabel={(value) => value === 'all' ? 'Semua Kecamatan / UPZIS' : value} />
            <Filter label="Workflow" value={filters.state} onChange={(value) => { setFilters((current) => ({ ...current, state: value })); setPage(1); }} options={['all', 'WAITING_PC_APPROVAL', 'FINAL_APPROVED']} optionLabel={(value) => value === 'all' ? 'Menunggu + history final' : packageStateLabel(value as GorutPackageSummary['workflow']['currentState'])} />
            <Filter label={mode === 'validasi' ? 'Status Validasi' : mode === 'approval' ? 'Kesiapan Final' : 'Status Settlement'} value={filters.readiness} onChange={(value) => { setFilters((current) => ({ ...current, readiness: value })); setPage(1); }} options={readinessOptions(mode)} optionLabel={readinessLabel} />
          </div></div>
          <footer><p aria-live="polite">Menampilkan <strong>{filtered.length}</strong> package</p><span>{filtersActive ? 'Filter aktif diterapkan' : 'Belum ada filter aktif'}</span></footer>
        </section>

        <p className="gorut-collect-readonly-note gorut-admin-note"><Info size={15} />{copy.note}</p>
        {api.notice ? <div className="gorut-pc-notice" role="status"><Info size={15} />{api.notice}</div> : null}
        {feedback ? <div className="gorut-pc-notice is-success" role="status"><CheckCircle2 size={15} />{feedback}<button type="button" onClick={() => setFeedback('')} aria-label="Tutup pemberitahuan">×</button></div> : null}
        {api.error ? <div className="gorut-pc-notice is-error" role="alert"><AlertTriangle size={15} /><span>{api.error}</span><button type="button" onClick={() => void api.reload()} disabled={api.loading}>Muat ulang</button></div> : null}

        <section className="pjm-panel gorut-admin-panel" aria-label={`Queue ${copy.title}`} aria-busy={api.loading || undefined}>
          <header className="pjm-toolbar gorut-admin-toolbar"><label className="pjm-search"><Search size={16} /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Cari package, Kecamatan, atau evidence" aria-label="Cari package" /></label><div className="gorut-admin-toolbar-actions"><span className="gorut-admin-readiness"><ShieldCheck size={14} />Capability dari server</span><label className="pjm-page-size"><Rows3 size={15} /><span>Tampilkan</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span>baris</span></label></div></header>
          {api.loading && !api.packages.length ? <OperationLoadingState rows={6} /> : api.error && !api.packages.length ? <OperationErrorState message={api.error} onRetry={() => void api.reload()} /> : !filtered.length ? <OperationEmptyState icon={<SearchX size={24} />} title="Belum ada package yang cocok" description="Ubah filter atau tunggu package authoritative mencapai proses PC." action={filtersActive ? <button type="button" onClick={resetFilters}>Reset Filter</button> : undefined} /> : <PackageRows mode={mode} rows={pageRows} onDetail={openDetail} />}
          {!api.loading && filtered.length ? <footer className="gorut-collect-pagination"><div className="gorut-pagination-info">Menampilkan <strong>{(safePage - 1) * pageSize + 1}–{Math.min(filtered.length, safePage * pageSize)}</strong> dari <strong>{filtered.length}</strong> package</div><div className="gorut-pagination-buttons"><button type="button" disabled={safePage === 1} onClick={() => setPage(1)}>Awal</button><button type="button" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Sebelumnya</button><span className="gorut-pagination-current">Halaman <strong>{safePage}</strong> dari <strong>{pageCount}</strong></span><button type="button" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}>Berikutnya</button><button type="button" disabled={safePage === pageCount} onClick={() => setPage(pageCount)}>Akhir</button></div></footer> : null}
        </section>
      </div>

      <PackageDetailDialog mode={mode} open={Boolean(selectedCode)} detail={detail} loading={api.detailLoading} participants={api.settlementParticipants} participantsLoading={api.participantsLoading} isPending={api.isPending} onClose={() => { if (!api.hasPendingMutation) { setSelectedCode(null); api.clearDetail(); } }} onSettlement={async (command) => { if (!selectedCode) return; await api.executeSettlement(selectedCode, command); setFeedback(command.supersedesEvidenceCode ? 'Koreksi evidence tersimpan sebagai revision baru dan package canonical sudah dimuat ulang.' : 'Penerimaan factual tersimpan; state workflow tetap menunggu proses PC.'); }} onValidation={async (note) => { if (!selectedCode || !detail?.settlement.latest) return; await api.executeValidation(selectedCode, { settlementEvidenceCode: detail.settlement.latest.evidenceCode, note: note || null, expectedVersion: detail.identity.version }); setFeedback('Validation server selesai dan package canonical sudah dimuat ulang.'); }} onApprove={async () => { if (!selectedCode || !detail) return; const canonical = await api.executeTransition(selectedCode, { action: 'APPROVE', expectedVersion: detail.identity.version }); setFeedback(canonical.workflow.currentState === 'FINAL_APPROVED' ? 'Settlement telah diverifikasi dan disetujui PC.' : 'Transition selesai; state canonical sudah dimuat ulang.'); }} />
    </GorutAppShell>
  );
}

function priority(mode: PcWorkspaceMode, item: GorutPackageSummary) {
  if (item.workflow.currentState === 'FINAL_APPROVED') return 90;
  if (mode === 'validasi') return item.settlement.validation.status === 'STALE' ? 0 : item.settlement.validation.status === 'NOT_VALIDATED' ? 1 : item.settlement.validation.result === 'MISMATCH' ? 2 : 10;
  if (mode === 'approval') return item.settlement.finalApprovalReadiness.status === 'READY' ? 0 : 10;
  return item.settlement.latest ? 10 : 0;
}

function readinessValue(mode: PcWorkspaceMode, item: GorutPackageSummary) {
  if (mode === 'validasi') return item.settlement.validation.status === 'CURRENT' ? item.settlement.validation.result ?? 'CURRENT' : item.settlement.validation.status;
  if (mode === 'approval') return item.settlement.finalApprovalReadiness.status;
  return item.settlement.status;
}

function readinessOptions(mode: PcWorkspaceMode) {
  return mode === 'validasi' ? ['all', 'NOT_VALIDATED', 'STALE', 'MATCHED', 'MISMATCH'] : mode === 'approval' ? ['all', 'READY', 'BLOCKED'] : ['all', 'NOT_RECORDED', 'EVIDENCE_RECORDED'];
}

function readinessLabel(value: string) {
  const labels: Record<string, string> = { all: 'Semua', NOT_RECORDED: 'Belum tercatat', EVIDENCE_RECORDED: 'Evidence tercatat', NOT_VALIDATED: 'Belum divalidasi', CURRENT: 'Current', STALE: 'Perlu validasi ulang', MATCHED: 'Nominal sesuai', MISMATCH: 'Ada selisih', READY: 'Siap', BLOCKED: 'Terblokir' };
  return labels[value] ?? value;
}

function Filter({ label, value, onChange, options, optionLabel }: { label: string; value: string; onChange: (value: string) => void; options: string[]; optionLabel: (value: string) => string }) {
  const id = `pc-filter-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return <div className="pjm-filter"><label className="pjm-filter-label" htmlFor={id}>{label}</label><select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option} key={option}>{optionLabel(option)}</option>)}</select></div>;
}

function PackageRows({ mode, rows, onDetail }: { mode: PcWorkspaceMode; rows: GorutPackageSummary[]; onDetail: (item: GorutPackageSummary) => Promise<void> }) {
  return <><div className="pjm-table-wrap gorut-admin-table-wrap"><table className="pjm-table gorut-admin-table gorut-pc-package-table"><thead><tr><th>Package / Periode</th><th>Kecamatan / UPZIS</th><th className="is-amount">Jumlah Tercatat</th><th className="is-amount">Gross</th><th className="is-amount">Bisyaroh PLPK</th><th className="is-amount">Jumlah Bersih</th><th>Settlement</th><th>Validation</th>{mode === 'approval' ? <th>Kesiapan Final</th> : null}<th>Workflow</th><th>Aksi</th></tr></thead><tbody>{rows.map((item) => <tr key={item.identity.packageCode} className={item.settlement.finalApprovalReadiness.status === 'BLOCKED' ? 'is-attention' : undefined}><td><strong>{item.identity.packageCode}</strong><small>{item.period.label} · revision {item.identity.revision}</small></td><td><strong>{item.region.kecamatan.name}</strong><small>{item.transactions.plpkCount} PLPK · {item.transactions.munfiqCount} Munfiq</small></td><td className="is-amount">{packageFinancialLabel(item, 'recordedAmount')}</td><td className="is-amount">{packageFinancialLabel(item, 'grossAmount')}</td><td className="is-amount">{packageFinancialLabel(item, 'totalPlpkFee')}</td><td className="is-amount"><strong>{packageFinancialLabel(item, 'netAmount')}</strong>{item.financial.status !== 'READY' ? <small>Belum siap</small> : null}</td><td><Status value={settlementLabel(item)} tone={item.settlement.latest ? 'positive' : 'warning'} /><small>{item.settlement.latest ? settlementModeLabel(item.settlement.latest.mode) : 'Belum ada evidence'}</small></td><td><Status value={validationLabel(item)} tone={item.settlement.validation.result === 'MATCHED' ? 'positive' : item.settlement.validation.result === 'MISMATCH' || item.settlement.validation.status === 'STALE' ? 'warning' : 'default'} />{item.settlement.validation.validatedAt ? <small>{formatPackageTimestamp(item.settlement.validation.validatedAt)}</small> : null}</td>{mode === 'approval' ? <td><Status value={item.settlement.finalApprovalReadiness.status === 'READY' ? 'Siap disetujui' : 'Terblokir'} tone={item.settlement.finalApprovalReadiness.status === 'READY' ? 'positive' : 'warning'} /></td> : null}<td><span className={`gorut-admin-badge ${packageStatusTone(item.workflow.currentState, item.financial.status)}`}>{item.workflow.currentState === 'FINAL_APPROVED' ? 'Disetujui PC' : packageStateLabel(item.workflow.currentState)}</span><small>{primaryBlocker(mode, item)}</small></td><td><button type="button" className="gorut-admin-detail-button" onClick={() => void onDetail(item)}><Eye size={14} />Detail</button></td></tr>)}</tbody></table></div><div className="gorut-admin-cards">{rows.map((item) => <article key={`mobile-${item.identity.packageCode}`}><header><div><strong>{item.identity.packageCode}</strong><span>{item.period.label} · {item.region.kecamatan.name}</span></div><Status value={item.workflow.currentState === 'FINAL_APPROVED' ? 'Disetujui PC' : packageStateLabel(item.workflow.currentState)} tone={item.workflow.currentState === 'FINAL_APPROVED' ? 'positive' : 'default'} /></header><dl><Fact label="Jumlah Bersih" value={packageFinancialLabel(item, 'netAmount')} /><Fact label="Settlement" value={settlementLabel(item)} /><Fact label="Validation" value={validationLabel(item)} />{mode === 'approval' ? <Fact label="Kesiapan Final" value={item.settlement.finalApprovalReadiness.status} /> : null}</dl><button type="button" className="gorut-admin-detail-button" onClick={() => void onDetail(item)}><Eye size={14} />Lihat Detail</button></article>)}</div></>;
}

function PackageDetailDialog({ mode, open, detail, loading, participants, participantsLoading, isPending, onClose, onSettlement, onValidation, onApprove }: { mode: PcWorkspaceMode; open: boolean; detail: GorutPackageDetail | null; loading: boolean; participants: Array<{ memberId: string; name: string }>; participantsLoading: boolean; isPending: (intentId: string) => boolean; onClose: () => void; onSettlement: (command: PackageSettlementCommand) => Promise<void>; onValidation: (note: string) => Promise<void>; onApprove: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [handedOverBy, setHandedOverBy] = useState('');
  const [externalReference, setExternalReference] = useState('');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const latest = detail?.settlement.latest ?? null;
  const settlementPending = detail ? isPending(`package:${detail.identity.packageCode}:settlement:PC_PICKUP`) : false;
  const validationPending = detail && latest ? isPending(`package:${detail.identity.packageCode}:validation:${latest.evidenceCode}`) : false;
  const approvalPending = detail ? isPending(`package:${detail.identity.packageCode}:APPROVE`) : false;
  const pending = settlementPending || validationPending || approvalPending;

  const resetForm = () => { setShowForm(false); setAmount(''); setOccurredAt(''); setHandedOverBy(''); setExternalReference(''); setEvidenceReference(''); setNote(''); setFormError(''); };
  const submitSettlement = async () => {
    if (!detail) return;
    const actualAmount = canonicalAmount(amount);
    if (!actualAmount) return setFormError('Nominal wajib berupa angka rupiah tanpa koma atau exponent. Contoh: 27500.');
    if (!occurredAt) return setFormError('Waktu penerimaan factual wajib diisi.');
    if (!handedOverBy) return setFormError('Pilih petugas UPZIS yang menyerahkan uang.');
    setFormError('');
    try {
      await onSettlement({ mode: 'PC_PICKUP', actualAmount, occurredAt: new Date(occurredAt).toISOString(), handedOverByMemberId: handedOverBy, externalReference: externalReference || null, evidenceReference: evidenceReference || null, note: note || null, supersedesEvidenceCode: latest?.mode === 'PC_PICKUP' ? latest.evidenceCode : null, expectedVersion: detail.identity.version });
      resetForm();
    } catch { /* hook owns canonical error presentation; keep form values for retry */ }
  };
  const submitValidation = async () => { setFormError(''); try { await onValidation(note); setNote(''); } catch { /* preserve retry intent */ } };
  const submitApproval = async () => { setFormError(''); try { await onApprove(); } catch { /* canonical error is rendered by workspace */ } };

  return <Dialog open={open} onOpenChange={(next) => { if (!next && !pending) { resetForm(); onClose(); } }}><DialogContent className="gorut-admin-dialog gorut-pc-package-dialog" showCloseButton={false} aria-busy={pending || undefined}>
    <header><div><span>PACKAGE AUTHORITATIVE</span><DialogTitle>{detail?.identity.packageCode ?? 'Memuat package…'}</DialogTitle><DialogDescription>{detail ? `${detail.period.label} · ${detail.region.kecamatan.name}` : 'Mengambil canonical package detail dari server.'}</DialogDescription></div><button type="button" onClick={() => { resetForm(); onClose(); }} disabled={pending} aria-label="Tutup detail">×</button></header>
    {loading || !detail ? <OperationLoadingState rows={5} /> : <>
      <div className="gorut-pc-detail-scroll">
        <section className="gorut-pc-detail-section"><h3>Financial package</h3><dl><Fact label="Jumlah Tercatat" value={packageFinancialLabel(detail, 'recordedAmount')} /><Fact label="Total Penghimpunan / Gross" value={packageFinancialLabel(detail, 'grossAmount')} /><Fact label="Bisyaroh PLPK" value={packageFinancialLabel(detail, 'totalPlpkFee')} /><Fact label="Jumlah Bersih / Expected" value={packageFinancialLabel(detail, 'netAmount')} /><Fact label="Financial status" value={detail.financial.status} /><Fact label="Version / revision" value={`${detail.identity.version} / ${detail.identity.revision}`} /></dl>{detail.financial.feePolicyAuthority ? <p className="gorut-pc-policy-label">{detail.financial.feePolicyAuthority} · {detail.financial.feePolicyVersion}</p> : isProvisionalFeePolicy(detail.financial.calculationPolicyVersion) ? <p className="gorut-pc-policy-label">PROVISIONAL_PENDING_SOP_CONFIRMATION · {detail.financial.calculationPolicyVersion}</p> : null}</section>
        <SettlementSection latest={latest} history={detail.settlement.history} />
        <ValidationSection detail={detail} />
        {mode === 'approval' || detail.finalApproval.approved ? <FinalApprovalSection detail={detail} /> : null}
        <section className="gorut-pc-detail-section"><h3>Workflow & blocker</h3><div className="gorut-pc-status-row"><Status value={detail.workflow.currentState === 'FINAL_APPROVED' ? 'Disetujui PC' : packageStateLabel(detail.workflow.currentState)} tone={detail.workflow.currentState === 'FINAL_APPROVED' ? 'positive' : 'default'} /><span>Version {detail.workflow.version}</span></div><BlockingReasons reasons={workflowBlockers(mode, detail)} /><div className="gorut-pc-history">{detail.workflow.history.map((event) => <article key={event.sequence}><strong>{event.action}</strong><span>{event.fromState ?? '—'} → {event.toState}</span><small>{event.actor.name}{event.actor.role ? ` · ${event.actor.role}` : ''} · {formatPackageTimestamp(event.occurredAt)}</small></article>)}</div></section>

        {mode === 'setoran' && detail.settlement.availableActions.includes('RECORD_PC_PICKUP') ? <section className="gorut-pc-detail-section"><h3>{latest?.mode === 'PC_PICKUP' ? 'Koreksi evidence pickup' : 'Catat penerimaan PC'}</h3>{!showForm ? <button type="button" className="gorut-button gorut-primary-button" onClick={() => setShowForm(true)}>{latest?.mode === 'PC_PICKUP' ? 'Buat revision evidence' : 'Catat penerimaan factual'}</button> : <div className="gorut-pc-command-form"><p>Expected server: <strong>{packageFinancialLabel(detail, 'netAmount')}</strong>. Nominal actual tetap disimpan walaupun berbeda.</p><label>Petugas UPZIS yang menyerahkan<select value={handedOverBy} onChange={(event) => setHandedOverBy(event.target.value)} disabled={participantsLoading || settlementPending}><option value="">{participantsLoading ? 'Memuat petugas…' : 'Pilih petugas UPZIS'}</option>{participants.map((person) => <option key={person.memberId} value={person.memberId}>{person.name} · {person.memberId}</option>)}</select></label><label>Nominal actual diterima<input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="27500" disabled={settlementPending} /></label><label>Waktu penerimaan factual<input type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} disabled={settlementPending} /></label><label>Referensi eksternal (opsional)<input value={externalReference} onChange={(event) => setExternalReference(event.target.value)} maxLength={240} disabled={settlementPending} /></label><label>Referensi evidence / berita acara (opsional)<input value={evidenceReference} onChange={(event) => setEvidenceReference(event.target.value)} maxLength={240} disabled={settlementPending} /></label><label>Catatan (opsional)<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} rows={3} disabled={settlementPending} /></label>{formError ? <p className="gorut-pc-form-error" role="alert"><AlertTriangle size={14} />{formError}</p> : null}<div className="gorut-pc-form-actions"><button type="button" className="gorut-button gorut-secondary-button" onClick={resetForm} disabled={settlementPending}>Batal</button><button type="button" className="gorut-button gorut-primary-button" onClick={() => void submitSettlement()} disabled={settlementPending || participantsLoading} aria-busy={settlementPending || undefined}>{settlementPending ? 'Menyimpan…' : 'Simpan evidence'}</button></div></div>}</section> : null}

        {mode === 'validasi' && detail.settlement.validation.availableActions.includes('VALIDATE_SETTLEMENT') && latest ? <section className="gorut-pc-detail-section"><h3>Validasi settlement aktif</h3><p>Server akan membandingkan snapshot expected dan actual evidence <strong>{latest.evidenceCode}</strong>. Result tidak dikirim oleh browser.</p><label className="gorut-pc-note-field">Catatan validator (opsional)<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1000} disabled={validationPending} /></label><button type="button" className="gorut-button gorut-primary-button" onClick={() => void submitValidation()} disabled={validationPending} aria-busy={validationPending || undefined}>{validationPending ? 'Memvalidasi…' : 'Validasi settlement'}</button></section> : null}

        {mode === 'approval' && detail.workflow.availableActions.includes('APPROVE') ? <section className="gorut-pc-detail-section gorut-pc-final-action"><h3>Keputusan PC</h3><p>Settlement current telah MATCHED dan seluruh gate server READY. Approval menghasilkan FINAL_APPROVED; bukan bank settlement atau FINAL_CLOSE.</p><button type="button" className="gorut-button gorut-primary-button" onClick={() => void submitApproval()} disabled={approvalPending} aria-busy={approvalPending || undefined}>{approvalPending ? 'Menyetujui…' : 'Setujui PC'}</button></section> : null}
      </div>
      <footer><button type="button" className="gorut-button gorut-secondary-button" onClick={() => { resetForm(); onClose(); }} disabled={pending}>Tutup</button></footer>
    </>}
  </DialogContent></Dialog>;
}

function SettlementSection({ latest, history }: { latest: GorutSettlementEvidence | null; history: GorutSettlementEvidence[] }) {
  return <section className="gorut-pc-detail-section"><h3>Settlement / handover</h3>{latest ? <><dl><Fact label="Mode" value={settlementModeLabel(latest.mode)} /><Fact label="Evidence aktif" value={`${latest.evidenceCode} · revision ${latest.revision}`} /><Fact label="Expected" value={formatCanonicalRupiah(latest.expectedAmount)} /><Fact label="Actual" value={formatCanonicalRupiah(latest.actualAmount)} /><Fact label="Difference" value={formatSignedCanonicalRupiah(latest.difference)} /><Fact label="Perbandingan" value={latest.comparison.status === 'NOMINAL_SESUAI' ? 'Nominal sesuai' : 'Ada selisih — perlu klarifikasi'} /><Fact label="Occurred at" value={formatPackageTimestamp(latest.occurredAt)} /><Fact label="Recorded at" value={formatPackageTimestamp(latest.recordedAt)} /><Fact label="Penyerah / depositor" value={latest.actors.handedOverBy?.name ?? latest.actors.depositedBy?.name ?? 'Tidak tersedia'} /><Fact label="Penerima PC" value={latest.actors.receivedBy?.name ?? 'Tidak berlaku / belum tersedia'} /><Fact label="Bank" value={latest.bank ?? 'Tidak berlaku'} /><Fact label="External reference" value={latest.externalReference ?? 'Tidak tersedia'} /><Fact label="Evidence / berita acara" value={latest.evidenceReference ?? 'Tidak tersedia'} /></dl>{latest.mode === 'UPZIS_BANK_DEPOSIT' ? <p className="gorut-admin-dialog-note"><Info size={14} />Evidence bank dibaca factual. Halaman tidak mengklaim bank settled atau dana cleared.</p> : null}</> : <p className="gorut-pc-empty">Belum ada evidence serah-terima/setoran.</p>}<div className="gorut-pc-evidence-history"><h4>Immutable evidence history</h4>{history.length ? history.map((item) => <article key={item.evidenceCode} className={item.supersededByEvidenceCode ? 'is-stale' : undefined}><strong>{item.evidenceCode}</strong><span>Revision {item.revision} · {settlementModeLabel(item.mode)}</span><span>{formatCanonicalRupiah(item.actualAmount)} · selisih {formatSignedCanonicalRupiah(item.difference)}</span><small>{item.supersededByEvidenceCode ? `Digantikan oleh ${item.supersededByEvidenceCode}` : 'Evidence aktif'} · {formatPackageTimestamp(item.recordedAt)}</small></article>) : <p>Belum ada history.</p>}</div></section>;
}

function ValidationSection({ detail }: { detail: GorutPackageDetail }) {
  const validation = detail.settlement.validation;
  return <section className="gorut-pc-detail-section"><h3>Validation</h3><dl><Fact label="Status" value={readinessLabel(validation.status)} /><Fact label="Result current" value={validation.result === 'MATCHED' ? 'MATCHED · Nominal sesuai' : validation.result === 'MISMATCH' ? 'MISMATCH · Perlu klarifikasi UPZIS dan PC' : 'Belum tersedia'} /><Fact label="Validation code" value={validation.validationCode ?? 'Belum tersedia'} /><Fact label="Evidence source" value={validation.settlementEvidenceCode ?? 'Belum tersedia'} /><Fact label="Difference" value={formatSignedCanonicalRupiah(validation.difference)} /><Fact label="Validator" value={validation.validator?.name ?? 'Belum tersedia'} /><Fact label="Validated at" value={formatPackageTimestamp(validation.validatedAt)} /><Fact label="Readiness final" value={detail.settlement.finalApprovalReadiness.status} /></dl>{validation.status === 'STALE' ? <p className="gorut-pc-warning"><AlertTriangle size={14} />Validation lama sudah tidak berlaku untuk evidence terbaru; validation baru diperlukan.</p> : null}{validation.result === 'MISMATCH' ? <p className="gorut-pc-warning"><AlertTriangle size={14} />Ada selisih nominal yang perlu diklarifikasi. Tidak ada RETURN atau reject otomatis.</p> : null}<div className="gorut-pc-validation-history"><h4>Immutable validation history</h4>{validation.historical.length ? validation.historical.map((item) => <article key={item.validationCode} className={item.status === 'STALE' ? 'is-stale' : undefined}><strong>{item.validationCode}</strong><span>{item.result} · evidence {item.settlementEvidenceCode}</span><span>Selisih {formatSignedCanonicalRupiah(item.difference)}</span><small>{item.status === 'STALE' ? 'STALE · tidak berlaku untuk evidence terbaru' : 'CURRENT'} · {item.validator.name} · {formatPackageTimestamp(item.validatedAt)}</small></article>) : <p>Belum ada validation history.</p>}</div></section>;
}

function FinalApprovalSection({ detail }: { detail: GorutPackageDetail }) {
  const approval = detail.finalApproval;
  return <section className="gorut-pc-detail-section"><h3>Final approval PC</h3>{approval.approved ? <dl><Fact label="Status" value="Disetujui PC" /><Fact label="Approved at" value={formatPackageTimestamp(approval.approvedAt)} /><Fact label="Approved by" value={approval.approvedBy?.name ?? 'Tidak tersedia'} /><Fact label="Validation source" value={approval.sourceValidationCode ?? 'Tidak tersedia'} /><Fact label="Settlement source" value={approval.settlementEvidenceCode ?? 'Tidak tersedia'} /><Fact label="Package version" value={approval.packageVersion ? `${approval.packageVersion.before} → ${approval.packageVersion.after}` : 'Tidak tersedia'} /></dl> : <><Status value={approval.readiness.status === 'READY' ? 'Siap disetujui' : 'Belum siap'} tone={approval.readiness.status === 'READY' ? 'positive' : 'warning'} /><BlockingReasons reasons={approval.readiness.blockingReasons} /></>}<p className="gorut-admin-dialog-note"><Info size={14} />Tidak menyatakan bank settled, dana cleared, F.016 terbit, arsip selesai, atau FINAL_CLOSE.</p></section>;
}

function BlockingReasons({ reasons }: { reasons: string[] }) {
  return reasons.length ? <ul className="gorut-pc-blockers">{reasons.map((reason) => <li key={reason}><AlertTriangle size={13} /><span>{packageBlockingReasonLabel(reason)}</span><code>{reason}</code></li>)}</ul> : <p className="gorut-pc-empty">Tidak ada blocking reason dari server.</p>;
}

function workflowBlockers(mode: PcWorkspaceMode, detail: GorutPackageDetail) {
  if (mode === 'setoran') return detail.settlement.blockingReasons;
  if (mode === 'validasi') return detail.settlement.validation.blockingReasons;
  return detail.workflow.blockingReasons;
}

function primaryBlocker(mode: PcWorkspaceMode, item: GorutPackageSummary) {
  const reasons = mode === 'setoran' ? item.settlement.blockingReasons : mode === 'validasi' ? item.settlement.validation.blockingReasons : item.workflow.blockingReasons;
  return reasons[0] ? packageBlockingReasonLabel(reasons[0]) : 'Tidak ada blocker';
}

function settlementLabel(item: GorutPackageSummary) { return item.settlement.latest ? 'Evidence tercatat' : 'Belum tercatat'; }
function validationLabel(item: GorutPackageSummary) { const value = item.settlement.validation; return value.status === 'STALE' ? 'STALE · validasi ulang' : value.result === 'MATCHED' ? 'Nominal sesuai' : value.result === 'MISMATCH' ? 'MISMATCH' : 'Belum divalidasi'; }
function settlementModeLabel(mode: GorutSettlementEvidence['mode']) { return mode === 'PC_PICKUP' ? 'PC pickup' : 'UPZIS bank deposit'; }
function canonicalAmount(value: string) { return /^(?:0|[1-9]\d{0,16})$/.test(value) ? `${value}.00` : null; }

function Status({ value, tone }: { value: string; tone: 'positive' | 'warning' | 'default' }) { const className = tone === 'positive' ? 'is-success' : tone === 'warning' ? 'is-waiting' : 'is-neutral'; return <span className={`gorut-admin-badge ${className}`}>{value}</span>; }
function Fact({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
