import { useState } from 'react';
import { FileText, X } from 'lucide-react';
import { F009Preview } from '@/components/gorut-v2/pengambilan/f009-preview';
import { formatRupiah } from '@/features/gorut-v2/formatters';
import { getBatch, validateKordesDecision } from '@/features/gorut-v2/kordes-mock-data';
import type { KordesVerification } from '@/features/gorut-v2/types';

export function VerificationWizard({ item, onClose, onSave }: { item: KordesVerification | null; onClose: () => void; onSave: (next: KordesVerification) => void }) {
  const [moneyMatches, setMoneyMatches] = useState<boolean>();
  const [hasDamagedMoney, setHasDamagedMoney] = useState<boolean>();
  const [cashReceived, setCashReceived] = useState<boolean>();
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(false);
  if (!item) return null;
  const batch = getBatch(item.batchId);
  const valid = validateKordesDecision({ moneyMatches, hasDamagedMoney, cashReceived, notes });
  const save = () => {
    if (!valid) return;
    onSave({ ...item, moneyMatches, hasDamagedMoney, cashReceived, notes: notes.trim() || undefined, status: moneyMatches && cashReceived ? 'verified-by-kordes' : 'needs-correction', verifiedAt: new Date().toISOString(), verifiedByKordesName: item.kordesName });
  };
  return (
    <div className="kordes-overlay" role="dialog" aria-modal="true" aria-label="Verifikasi Data Kordes">
      <div className="kordes-wizard">
        <div className="kordes-wizard-header"><div><p>VERIFIKASI KORDES</p><h2>Verifikasi Data</h2></div><button type="button" className="kordes-close-inline" onClick={onClose}><X /></button></div>
        <div className="kordes-wizard-body">
          <div className="kordes-wizard-grid">
            {([['Nama PLPK', item.plpkName], ['ID PLPK', item.plpkId], ['Periode', item.period], ['Nomor F.009', item.f009DocumentNumber], ['Nominal Terjemput', formatRupiah(item.grossAmount)], ['Kaleng Terjemput', batch.collectedCanCount], ['Kaleng Tidak Terjemput', batch.uncollectedCanCount], ['Bisyaroh PLPK', formatRupiah(item.totalPlpkFee)], ['Jumlah Bersih yang Harus Diterima Kordes', formatRupiah(item.netAmount)]] as [string, string | number][]).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
          </div>
          <button type="button" className="gorut-button gorut-secondary-button" onClick={() => setPreview(true)}><FileText size={14} />Lihat F.009</button>
          <Choice label="Jumlah uang sesuai?" value={moneyMatches} onChange={setMoneyMatches} />
          <Choice label="Ada uang rusak?" value={hasDamagedMoney} onChange={setHasDamagedMoney} />
          <Choice label="Uang sudah diterima?" value={cashReceived} onChange={setCashReceived} />
          <label className="kordes-field">Catatan verifikasi<textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          {!cashReceived && cashReceived !== undefined ? <small className="kordes-error">Verifikasi tidak dapat diselesaikan sebelum uang diterima.</small> : null}
          {(!moneyMatches || hasDamagedMoney) && (moneyMatches !== undefined && hasDamagedMoney !== undefined) && !notes.trim() ? <small className="kordes-error">Catatan wajib untuk kondisi tidak sesuai atau uang rusak.</small> : null}
        </div>
        <div className="kordes-wizard-footer"><button type="button" className="gorut-button gorut-secondary-button" onClick={onClose}>Batal</button><button type="button" className="gorut-button gorut-primary-button" disabled={!valid} onClick={save}>Verifikasi Data</button></div>
      </div>
      <F009Preview batch={preview ? batch : null} onClose={() => setPreview(false)} />
    </div>
  );
}

function Choice({ label, value, onChange }: { label: string; value: boolean | undefined; onChange: (value: boolean) => void }) {
  return <fieldset className="kordes-field"><legend>{label}</legend><div><button type="button" className="gorut-button gorut-secondary-button" aria-pressed={value === true} onClick={() => onChange(true)}>Ya</button><button type="button" className="gorut-button gorut-secondary-button" aria-pressed={value === false} onClick={() => onChange(false)}>Tidak</button></div></fieldset>;
}
