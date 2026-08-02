import { PlaceholderShell } from '@/components/gorut-v2/placeholder-shell';

const documentCards = [
  { code: 'F.009', name: 'Formulir Penghimpunan PLPK', note: 'PLPK → Kordes' },
  { code: 'F.015', name: 'Rekap Hasil Penghimpunan Kordes', note: 'Kordes/desa → UPZIS' },
  { code: 'F.010', name: 'Rekap Penghimpunan Tingkat Desa', note: 'Kordes → UPZIS' },
  { code: 'F.016', name: 'Rekap Penerimaan UPZIS', note: 'UPZIS → PC' },
];

export default function DokumenAdministrasiPage() {
  return (
    <PlaceholderShell title="Dokumen Administrasi" description="Katalog dokumen resmi penghimpunan GORUT V2. Belum diimplementasikan.">
      <div className="gorut-doc-grid">
        {documentCards.map((card) => (
          <article key={card.code} className="gorut-doc-card">
            <div className="gorut-doc-card-head">
              <strong>{card.code}</strong>
              <span className="gorut-doc-badge">Belum diimplementasikan</span>
            </div>
            <h2>{card.name}</h2>
            <p>{card.note}</p>
          </article>
        ))}
      </div>
    </PlaceholderShell>
  );
}
