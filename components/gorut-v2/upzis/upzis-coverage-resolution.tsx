'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { PackageApiError, packageCoverageTargets, packageErrorMessage, preparePackageCoverageCommand, type GorutPackageDetail, type PackageCoverageCommand } from '@/features/gorut-v2/package-api-client';

type Review = { packageCode: string; target: { code: string; name: string }; command: PackageCoverageCommand };

export function UpzisCoverageResolution({ detail, pending, onExclude, onRefresh }: {
  detail: GorutPackageDetail;
  pending: boolean;
  onExclude: (command: PackageCoverageCommand) => Promise<GorutPackageDetail>;
  onRefresh: () => Promise<GorutPackageDetail>;
}) {
  const id = useId();
  const locked = useRef(false);
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const targets = packageCoverageTargets(detail);
  const disabled = pending || busy || needsRefresh;

  const select = (code: string) => {
    if (disabled || locked.current) return;
    setSelected(code); setReason(''); setReference(''); setReview(null); setError(''); setSuccess('');
  };
  const preview = (event: FormEvent) => {
    event.preventDefault();
    if (disabled || locked.current) return;
    try {
      const command = preparePackageCoverageCommand(detail, selected, reason, reference);
      const target = targets.find(row => row.code === command.rantingCode)!;
      setReview(Object.freeze({ packageCode: detail.identity.packageCode, target: Object.freeze({ ...target }), command: Object.freeze(command) }));
      setError('');
    } catch (caught) { setError(packageErrorMessage(caught)); }
  };
  const confirm = async () => {
    if (!review || disabled || locked.current) return;
    if (review.packageCode !== detail.identity.packageCode || review.command.expectedVersion !== detail.identity.version || !targets.some(target => target.code === review.target.code)) {
      setReview(null); setNeedsRefresh(true); setError('Data coverage berubah. Periksa detail terbaru dan tinjau ulang keputusan.'); return;
    }
    const confirmed = review;
    locked.current = true; setBusy(true); setError(''); setSuccess('');
    try {
      await onExclude(confirmed.command);
      setSuccess(`Keputusan coverage ${confirmed.target.code} tercatat dan telah dikonfirmasi dari server.`);
      setReview(null); setSelected(''); setReason(''); setReference('');
    } catch (caught) {
      setReview(null); setError(packageErrorMessage(caught));
      setNeedsRefresh(caught instanceof PackageApiError && (caught.status === 0 || caught.status === 409 || caught.status >= 500));
    } finally { locked.current = false; setBusy(false); }
  };
  const refresh = async () => {
    if (pending || busy || locked.current) return;
    locked.current = true; setBusy(true);
    try {
      await onRefresh();
      setNeedsRefresh(false); setReview(null); setSelected(''); setReason(''); setReference(''); setError('');
    } catch {
      setNeedsRefresh(true); setError('Detail coverage terbaru belum dapat diperiksa. Tidak ada keputusan tambahan yang dikirim.');
    } finally { locked.current = false; setBusy(false); }
  };

  if (!targets.length && !error && !success) return null;
  return <section className="upzis-coverage-resolution" aria-labelledby={targets.length ? `${id}-heading` : undefined} aria-label={!targets.length ? 'Hasil keputusan coverage' : undefined} aria-busy={pending || busy}>
    {targets.length > 0 && <>
      <h3 id={`${id}-heading`}>Ranting belum memiliki sumber periode ini</h3>
      <p>Daftar server menunjukkan coverage belum ditetapkan. Periksa sumber periode sebelum memutuskan pengecualian secara eksplisit sebagai UPZIS.</p>
      <p>Ranting yang memiliki authoritative transaction source tidak dapat dikecualikan.</p>
      <div className="upzis-coverage-targets">{targets.map(target => <article key={target.code} data-testid={`coverage-target-${target.code}`}>
        <div><strong>{target.name}</strong><span>{target.code}</span><span>Belum ditetapkan</span></div>
        <button type="button" className="gorut-button gorut-secondary-button" disabled={disabled || Boolean(review)} onClick={() => select(target.code)}>Tetapkan Tidak Ikut Periode</button>
      </article>)}</div>
    </>}
    {success && <p className="upzis-coverage-success" role="status">{success}</p>}
    {error && <p className="upzis-coverage-error" role="alert" data-testid="coverage-error">{error}</p>}
    {needsRefresh && <button type="button" className="gorut-button gorut-secondary-button" disabled={pending || busy} onClick={() => void refresh()}>Periksa detail terbaru</button>}
    {pending || busy ? <p role="status">Memeriksa hasil coverage dari server…</p> : null}
    {selected && !review && targets.some(target => target.code === selected) && <form className="upzis-coverage-form" onSubmit={preview}>
      <h4>Keputusan untuk {targets.find(target => target.code === selected)?.name} ({selected})</h4>
      <fieldset disabled={disabled}>
        <label htmlFor={`${id}-reason`}>Alasan pengecualian</label>
        <textarea id={`${id}-reason`} value={reason} onChange={event => setReason(event.target.value)} required maxLength={500} rows={4} />
        <label htmlFor={`${id}-reference`}>Referensi (opsional)</label>
        <input id={`${id}-reference`} value={reference} onChange={event => setReference(event.target.value)} maxLength={300} />
      </fieldset>
      <div className="upzis-coverage-actions"><button type="button" className="gorut-button gorut-secondary-button" disabled={disabled} onClick={() => { setSelected(''); setError(''); }}>Batal</button><button type="submit" className="gorut-button gorut-primary-button" disabled={disabled}>Periksa keputusan coverage</button></div>
    </form>}
    {review && <section className="upzis-coverage-confirmation" data-testid="coverage-confirmation" aria-labelledby={`${id}-confirm-heading`}>
      <h4 id={`${id}-confirm-heading`}>Periksa keputusan Tidak Ikut Periode</h4>
      <dl><div><dt>Package</dt><dd>{review.packageCode}</dd></div><div><dt>Ranting</dt><dd>{review.target.name} ({review.target.code})</dd></div><div><dt>Version yang ditinjau</dt><dd>{review.command.expectedVersion}</dd></div><div><dt>Alasan</dt><dd>{review.command.reason}</dd></div><div><dt>Referensi</dt><dd>{review.command.reference ?? 'Tidak ada'}</dd></div></dl>
      <p>Keputusan ini dicatat sebagai audit coverage. Package version akan berubah setelah pencatatan. Ini tidak mengirim atau menyetujui package.</p>
      <div className="upzis-coverage-actions"><button type="button" className="gorut-button gorut-secondary-button" disabled={disabled} onClick={() => setReview(null)}>Kembali edit</button><button type="button" className="gorut-button gorut-primary-button" disabled={disabled} onClick={() => void confirm()}>Ya, Tetapkan Tidak Ikut Periode</button></div>
    </section>}
  </section>;
}
