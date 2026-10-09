'use client';

import { AlertTriangle, CheckCircle2, Clock3, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  PackageApiError,
  packageReturnReasonCodes,
  type GorutPackageAction,
  type GorutPackageCorrectionTargetType,
  type GorutPackageDetail,
  type GorutPackageReturnReasonCode,
  type PackageTransitionCommand,
} from '@/features/gorut-v2/package-api-client';
import {
  formatCanonicalRupiah,
  formatPackageTimestamp,
  isProvisionalFeePolicy,
  packageActionLabels,
  packageBlockingReasonLabel,
  packageFinancialLabel,
  packageStateLabel,
  packageStatusTone,
  validatePackageReturnForm,
} from '@/features/gorut-v2/package-api-view-model';

type CorrectionTarget = {
  id: string;
  type: GorutPackageCorrectionTargetType;
  code: string;
  label: string;
};

const reasonLabels: Record<GorutPackageReturnReasonCode, string> = {
  DATA_INCOMPLETE: 'Data belum lengkap',
  AMOUNT_MISMATCH: 'Nominal tidak sesuai',
  UNRESOLVED_MAPPING: 'Pemetaan belum terselesaikan',
  COLLECTION_CORRECTION_REQUIRED: 'Collection perlu dikoreksi',
  FINANCIAL_RECONCILIATION_FAILED: 'Rekonsiliasi financial gagal',
  EVIDENCE_INCOMPLETE: 'Bukti belum lengkap',
  OTHER: 'Lainnya',
};

export function UpzisPackageDetail({
  open,
  detail,
  loading,
  pendingAction,
  onClose,
  onRetry,
  onTransition,
}: {
  open: boolean;
  detail: GorutPackageDetail | null;
  loading: boolean;
  pendingAction: GorutPackageAction | null;
  onClose: () => void;
  onRetry: () => void;
  onTransition: (command: PackageTransitionCommand) => Promise<void>;
}) {
  const [prompt, setPrompt] = useState<GorutPackageAction | null>(null);
  const [reasonCode, setReasonCode] = useState<GorutPackageReturnReasonCode>('DATA_INCOMPLETE');
  const [reason, setReason] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [resolutionNote, setResolutionNote] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) {
      setPrompt(null);
      setReasonCode('DATA_INCOMPLETE');
      setReason('');
      setSelectedTargets([]);
      setResolutionNote('');
      setFormError('');
    }
  }, [open]);

  const targets = useMemo<CorrectionTarget[]>(() => {
    if (!detail) return [];
    const rows: CorrectionTarget[] = [];
    for (const coverage of detail.coverage.rantings) {
      if (coverage.ranting) rows.push({
        id: `RANTING:${coverage.ranting.code}`,
        type: 'RANTING',
        code: coverage.ranting.code,
        label: `Ranting ${coverage.ranting.name} (${coverage.ranting.code})`,
      });
    }
    for (const transaction of detail.transactions.items) {
      rows.push({
        id: `TRANSACTION:${transaction.transactionCode}`,
        type: 'TRANSACTION',
        code: transaction.transactionCode,
        label: `Transaksi ${transaction.transactionCode} · ${transaction.plpk.name}`,
      });
      if (transaction.collectionSource) rows.push({
        id: `COLLECTION:${transaction.collectionSource.collectionCode}`,
        type: 'COLLECTION',
        code: transaction.collectionSource.collectionCode,
        label: `Collection ${transaction.collectionSource.collectionCode} · ${transaction.ranting.name}`,
      });
    }
    return rows;
  }, [detail]);

  if (!detail && !loading) return null;

  const submit = async () => {
    if (!detail || !prompt) return;
    setFormError('');
    let command: PackageTransitionCommand;
    if (prompt === 'RETURN') {
      const returnError = validatePackageReturnForm(reasonCode, reason, selectedTargets.length);
      if (returnError) return setFormError(returnError);
      command = {
        action: 'RETURN',
        expectedVersion: detail.identity.version,
        reasonCode,
        reason: reason.trim() || null,
        correctionTargets: selectedTargets.map((id) => {
          const target = targets.find((item) => item.id === id)!;
          return { targetType: target.type, targetCode: target.code };
        }),
      };
    } else if (prompt === 'SUBMIT') {
      const openCorrections = detail.corrections.filter((item) => item.status === 'OPEN');
      if (openCorrections.length && !resolutionNote.trim()) return setFormError('Catatan resolusi wajib diisi untuk pengiriman ulang.');
      command = {
        action: 'SUBMIT',
        expectedVersion: detail.identity.version,
        resolvedCorrectionCodes: openCorrections.map((item) => item.correctionCode),
        resolutionNote: openCorrections.length ? resolutionNote.trim() : null,
      };
    } else {
      command = { action: 'APPROVE', expectedVersion: detail.identity.version };
    }
    try {
      await onTransition(command);
      setPrompt(null);
      setReason('');
      setSelectedTargets([]);
      setResolutionNote('');
    } catch (error) {
      if (error instanceof PackageApiError && error.status === 409) setPrompt(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !pendingAction) onClose(); }}>
      <DialogContent showCloseButton={false} overlayClassName="upzis-verification-modal-backdrop" className="upzis-verification-modal upzis-package-modal" aria-describedby="upzis-package-detail-description">
        {loading && !detail ? (
          <div className="upzis-package-detail-loading" aria-busy="true">
            <Clock3 size={20} aria-hidden="true" />
            <strong>Memuat package canonical…</strong>
            <p>Detail, financial, coverage, dan workflow dibaca dari server.</p>
          </div>
        ) : detail ? (
          <>
            <header className="upzis-verification-modal-header">
              <div className="upzis-verification-modal-heading">
                <DialogTitle>{detail.identity.packageCode}</DialogTitle>
                <DialogDescription id="upzis-package-detail-description">{detail.period.label} · UPZIS {detail.region.kecamatan.name}</DialogDescription>
              </div>
              <div className="upzis-verification-modal-header-actions">
                <span className={`gorut-upzis-status ${packageStatusTone(detail.workflow.currentState, detail.financial.status)}`}>{packageStateLabel(detail.workflow.currentState)}</span>
                <DialogClose asChild><button type="button" className="upzis-verification-modal-close" aria-label="Tutup detail package" disabled={Boolean(pendingAction)}><X size={19} /></button></DialogClose>
              </div>
            </header>

            <div className="upzis-verification-modal-body">
              <Section title="A. Identitas">
                <dl className="upzis-verification-identity-grid">
                  <Fact label="Kode package" value={detail.identity.packageCode} />
                  <Fact label="Periode" value={detail.period.label} />
                  <Fact label="Kecamatan / UPZIS" value={detail.region.kecamatan.name} />
                  <Fact label="State" value={packageStateLabel(detail.workflow.currentState)} />
                  <Fact label="Version" value={String(detail.identity.version)} />
                  <Fact label="Revision" value={String(detail.identity.revision)} />
                </dl>
              </Section>

              <Section title="B. Financial authoritative">
                <div className="gorut-summary-grid upzis-verification-modal-summary">
                  <Metric label="Jumlah Tercatat" value={packageFinancialLabel(detail, 'recordedAmount')} />
                  <Metric label="Total Penghimpunan / Gross" value={packageFinancialLabel(detail, 'grossAmount')} />
                  <Metric label="Bisyaroh PLPK" value={packageFinancialLabel(detail, 'totalPlpkFee')} />
                  <Metric label="Jumlah Bersih" value={packageFinancialLabel(detail, 'netAmount')} highlighted={detail.financial.status === 'READY'} />
                </div>
                <div className="upzis-package-inline-status">
                  <span className={`pjm-badge ${detail.financial.status === 'READY' ? 'is-forwarded' : 'is-returned'}`}>Financial {detail.financial.status}</span>
                  {detail.financial.feePolicyAuthority ? <small>{detail.financial.feePolicyAuthority} · {detail.financial.feePolicyVersion}</small> : isProvisionalFeePolicy(detail.financial.calculationPolicyVersion) ? <small>PROVISIONAL_PENDING_SOP_CONFIRMATION · {detail.financial.calculationPolicyVersion}</small> : detail.financial.calculationPolicyVersion ? <small>Versi kalkulasi: {detail.financial.calculationPolicyVersion}</small> : null}
                </div>
                {detail.financial.status !== 'READY' ? <BlockingReasons reasons={detail.financial.blockingReasons} /> : null}
              </Section>

              <Section title="C. Coverage Ranting">
                <div className="upzis-package-coverage-summary">
                  <span>Included <strong>{detail.coverage.included}</strong></span>
                  <span>Excluded dengan alasan <strong>{detail.coverage.excluded}</strong></span>
                  <span>Unresolved <strong>{detail.coverage.unresolved}</strong></span>
                </div>
                <p className="upzis-package-roster-note">
                  Roster: {detail.coverage.roster.frozenAt ? `dibekukan server ${formatPackageTimestamp(detail.coverage.roster.frozenAt)}${detail.coverage.roster.frozenBy ? ` oleh ${detail.coverage.roster.frozenBy}` : ''}` : 'live, belum dibekukan sampai first SUBMIT berhasil'}.
                </p>
                <div className="upzis-package-list-grid">
                  {detail.coverage.rantings.map((row, index) => (
                    <article key={`${row.ranting?.code ?? row.sourceRantingKey ?? 'unresolved'}-${index}`} className={`gorut-upzis-breakdown ${row.status === 'unresolved' ? 'is-blocked' : ''}`}>
                      <div className="gorut-upzis-breakdown-head"><strong>{row.ranting?.name ?? row.sourceRantingName ?? 'Ranting belum terpetakan'}</strong><span>{row.status.toUpperCase()}</span></div>
                      <dl>
                        <Fact label="Kode" value={row.ranting?.code ?? row.sourceRantingKey ?? '—'} />
                        <Fact label="Transaksi" value={String(row.transactionCount)} />
                        <Fact label="PLPK / Munfiq" value={`${row.plpkCount} / ${row.munfiqCount}`} />
                        <Fact label="Jumlah Tercatat" value={formatCanonicalRupiah(row.recordedAmount)} />
                        {row.status === 'excluded-with-reason' ? <Fact label="Alasan pengecualian" value={row.exclusionReason ?? 'Audit alasan belum lengkap'} /> : null}
                        {row.exclusionReference ? <Fact label="Referensi" value={row.exclusionReference} /> : null}
                        {row.recordedAt ? <Fact label="Dicatat" value={`${formatPackageTimestamp(row.recordedAt)}${row.recordedBy ? ` · ${row.recordedBy}` : ''}`} /> : null}
                      </dl>
                    </article>
                  ))}
                </div>
              </Section>

              <Section title="D. Transaction / PLPK">
                <div className="upzis-package-list-grid">
                  {detail.transactions.items.map((transaction) => {
                    const collection = transaction.collectionSource;
                    return (
                      <article key={transaction.transactionCode} className="gorut-upzis-breakdown">
                        <div className="gorut-upzis-breakdown-head"><strong>{transaction.plpk.name}</strong><span>{transaction.transactionCode}</span></div>
                        <dl>
                          <Fact label="Ranting" value={`${transaction.ranting.name} · ${transaction.ranting.code}`} />
                          <Fact label="Jumlah Munfiq" value={String(transaction.munfiqCount)} />
                          <Fact label="Jumlah Tercatat" value={formatCanonicalRupiah(transaction.recordedAmount)} />
                          <Fact label="Collection" value={collection?.collectionCode ?? 'Sumber collection tidak tersedia'} />
                          <Fact label="Total Penghimpunan" value={formatCanonicalRupiah(collection?.grossAmount ?? null)} />
                          <Fact label="Bisyaroh / Bersih" value={`${formatCanonicalRupiah(collection?.totalPlpkFee ?? null)} / ${formatCanonicalRupiah(collection?.netAmount ?? null)}`} />
                          <Fact label="Status collection" value={collection?.lifecycleStatus ?? 'Tidak tersedia'} />
                          <Fact label="Rekonsiliasi sumber" value={collection?.reconciliationStatus === 'READY' ? 'Selaras' : 'Perlu rekonsiliasi'} />
                          <Fact label="Kordes re-verification" value={collection?.verification.verifiedByKordesAt ? formatPackageTimestamp(collection.verification.verifiedByKordesAt) : 'Belum selesai'} />
                        </dl>
                      </article>
                    );
                  })}
                </div>
              </Section>

              <Section title="E. Workflow">
                <div className="upzis-package-workflow-head">
                  <span className={`gorut-upzis-status ${packageStatusTone(detail.workflow.currentState)}`}>{packageStateLabel(detail.workflow.currentState)}</span>
                  <span>Version {detail.workflow.version}</span>
                </div>
                <BlockingReasons reasons={detail.workflow.blockingReasons} emptyLabel="Tidak ada blocking reason dari server." />
                <div className="upzis-package-history" aria-label="Riwayat workflow authoritative">
                  {detail.workflow.history.length ? detail.workflow.history.map((event) => (
                    <article key={event.sequence}>
                      <span><CheckCircle2 size={15} aria-hidden="true" /></span>
                      <div><strong>{event.action}</strong><p>{event.fromState ?? '—'} → {event.toState}</p><small>{event.actor.name}{event.actor.role ? ` · ${event.actor.role}` : ''} · {formatPackageTimestamp(event.occurredAt)}</small>{event.reasonCode || event.reason ? <em>{event.reasonCode ? `${event.reasonCode}: ` : ''}{event.reason ?? 'Tanpa catatan tambahan'}</em> : null}</div>
                    </article>
                  )) : <p className="upzis-package-empty-note">Belum ada workflow event. Materialization technical tidak membuat history sintetis.</p>}
                </div>
              </Section>

              <Section title="F. Correction">
                {detail.corrections.length ? <div className="upzis-package-corrections">{detail.corrections.map((correction) => {
                  const transaction = detail.transactions.items.find((item) => item.collectionSource?.collectionCode === correction.target.code || item.transactionCode === correction.target.code || item.ranting.code === correction.target.code);
                  const collection = transaction?.collectionSource;
                  return <article key={correction.correctionCode}>
                    <div><strong>{correction.targetType}: {correction.target.name ?? correction.target.code}</strong><span className={`pjm-badge ${correction.status === 'OPEN' ? 'is-returned' : 'is-forwarded'}`}>{correction.status}</span></div>
                    <p>{correction.reasonCode}{correction.reason ? ` · ${correction.reason}` : ''}</p>
                    <small>Diminta {formatPackageTimestamp(correction.requestedAt)} oleh {correction.requestedBy} · revision {detail.identity.revision}</small>
                    <small>Collection: {collection?.collectionCode ?? (correction.targetType === 'COLLECTION' ? correction.target.code : 'sesuai target server')}</small>
                    <small>Kordes re-verification: {collection?.verification.verifiedByKordesAt ? formatPackageTimestamp(collection.verification.verifiedByKordesAt) : 'belum selesai'}</small>
                    <small>Rekonsiliasi: {collection?.reconciliationStatus === 'READY' ? 'selaras' : 'menunggu rekonsiliasi'}</small>
                    {correction.resolvedAt ? <small>Resolved {formatPackageTimestamp(correction.resolvedAt)}{correction.resolvedBy ? ` oleh ${correction.resolvedBy}` : ''}{correction.resolutionNote ? ` · ${correction.resolutionNote}` : ''}</small> : null}
                  </article>;
                })}</div> : <p className="upzis-package-empty-note">Tidak ada correction package.</p>}
              </Section>

              {prompt ? (
                <Section title={packageActionLabels[prompt]}>
                  <div className="upzis-package-action-form" aria-busy={Boolean(pendingAction)}>
                    {prompt === 'RETURN' ? <>
                      <label>Kode alasan<select value={reasonCode} onChange={(event) => setReasonCode(event.target.value as GorutPackageReturnReasonCode)} disabled={Boolean(pendingAction)}>{packageReturnReasonCodes.map((code) => <option key={code} value={code}>{reasonLabels[code]}</option>)}</select></label>
                      <label>{reasonCode === 'OTHER' ? 'Alasan rinci (wajib)' : 'Catatan tambahan (opsional)'}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} disabled={Boolean(pendingAction)} /></label>
                      <fieldset><legend>Target koreksi (minimal satu)</legend>{targets.map((target) => <label key={target.id} className="upzis-package-target-option"><input type="checkbox" checked={selectedTargets.includes(target.id)} onChange={(event) => setSelectedTargets((current) => event.target.checked ? [...current, target.id] : current.filter((id) => id !== target.id))} disabled={Boolean(pendingAction)} /><span>{target.label}</span></label>)}</fieldset>
                    </> : prompt === 'SUBMIT' && detail.corrections.some((item) => item.status === 'OPEN') ? <label>Catatan resolusi pengiriman ulang<textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} rows={3} disabled={Boolean(pendingAction)} placeholder="Jelaskan bahwa sumber sudah dikoreksi, diverifikasi ulang Kordes, dan siap direkonsiliasi." /></label> : <p>Server akan menjalankan transition berdasarkan version canonical saat ini. State tidak akan berubah di layar sampai refetch berhasil.</p>}
                    {prompt === 'APPROVE' ? <p>Hasil factual hanya diteruskan ke proses PC; ini bukan penerimaan uang, settlement bank, atau final approval.</p> : null}
                    {formError ? <p className="upzis-package-form-error" role="alert"><AlertTriangle size={14} />{formError}</p> : null}
                    <div className="upzis-package-form-actions">
                      <button type="button" className="gorut-button gorut-secondary-button" onClick={() => setPrompt(null)} disabled={Boolean(pendingAction)}>Batal</button>
                      <button type="button" className="gorut-button gorut-primary-button" onClick={() => void submit()} disabled={Boolean(pendingAction)} aria-busy={Boolean(pendingAction)}>{pendingAction ? 'Memproses…' : packageActionLabels[prompt]}</button>
                    </div>
                  </div>
                </Section>
              ) : null}
            </div>

            <footer className="upzis-verification-modal-footer">
              <DialogClose asChild><button type="button" className="gorut-button gorut-secondary-button" disabled={Boolean(pendingAction)}>Tutup</button></DialogClose>
              <div className="upzis-verification-modal-primary-actions">
                {detail.workflow.availableActions.map((action) => <button key={action} type="button" className={`gorut-button ${action === 'RETURN' ? 'gorut-secondary-button' : 'gorut-primary-button'}`} onClick={() => { setFormError(''); setPrompt(action); }} disabled={Boolean(pendingAction)}>{packageActionLabels[action]}</button>)}
              </div>
            </footer>
          </>
        ) : (
          <div className="upzis-package-detail-loading"><AlertTriangle size={20} /><strong>Detail package belum tersedia</strong><button type="button" className="gorut-button gorut-secondary-button" onClick={onRetry}>Coba lagi</button></div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="gorut-drawer-section upzis-verification-modal-section"><h3>{title}</h3>{children}</section>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function Metric({ label, value, highlighted = false }: { label: string; value: string; highlighted?: boolean }) {
  return <div className={`gorut-summary-metric ${highlighted ? 'is-highlighted' : ''}`}><small>{label}</small><strong>{value}</strong></div>;
}

function BlockingReasons({ reasons, emptyLabel }: { reasons: string[]; emptyLabel?: string }) {
  if (!reasons.length) return emptyLabel ? <p className="upzis-package-empty-note">{emptyLabel}</p> : null;
  return <ul className="upzis-package-blockers">{reasons.map((reason) => <li key={reason}>{packageBlockingReasonLabel(reason)}</li>)}</ul>;
}
