import type { CollectionBatch, CollectionVisitStatus, KordesVillageRecap } from './types';

type DocumentRequest<T extends string, D> = {
  documentType: T;
  filename: string;
  data: D;
};

export type F009DocumentData = {
  documentNumber: string;
  verificationStatus: string;
  plpkName: string;
  plpkId: string;
  kecamatan: string;
  village: string;
  periodLabel: string;
  kordesName: string;
  activeCanCount: string;
  collectedCanCount: string;
  uncollectedCanCount: string;
  rows: Array<{ index: string; munfiqName: string; canCode: string; rt: string; rw: string; phone: string; amount: string; status: string }>;
};

export type F010DocumentData = {
  documentNumber: string;
  village: string;
  kecamatan: string;
  kordesName: string;
  periodLabel: string;
  fundraisingOfficerName: string;
  upzisOfficerName: string;
  rows: Array<{ index: string; plpkName: string; active: string; collected: string; percentage: string; average: string; gross: string; fee: string; net: string; verifiedAt: string }>;
  totalActive: string;
  totalCollected: string;
  totalPercentage: string;
  totalAverage: string;
  totalGross: string;
  totalFee: string;
  totalNet: string;
};

export type F015DocumentData = {
  documentNumber: string;
  handoverDate: string;
  handedBy: string;
  handedTo: string;
  totalNet: string;
  totalWords: string;
  village: string;
  kecamatan: string;
  totalActive: string;
  totalPlpk: string;
  totalCollected: string;
  totalUncollected: string;
  verificationStatus: string;
  fundraisingOfficerName: string;
  upzisOfficerName: string;
  kordesName: string;
};

export type GorutDocumentRequest =
  | DocumentRequest<'f009', F009DocumentData>
  | DocumentRequest<'f010', F010DocumentData>
  | DocumentRequest<'f015', F015DocumentData>;

const visitStatusLabels: Record<CollectionVisitStatus, string> = {
  pending: 'Belum Dikunjungi',
  collected: 'Terjemput',
  'not-around': 'Tidak Terjemput',
  'not-ready': 'Tidak Terjemput',
  declined: 'Tidak Terjemput',
  'damaged-lost': 'Tidak Terjemput',
};

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const words = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
const fundraisingOfficerName = 'Divisi Fundraising NU Care-LAZISNU Garut';

function formatNumber(value: number) {
  return Math.round(value).toLocaleString('id-ID');
}

function formatPeriod(period: string) {
  const [year, month] = period.split('-');
  return monthNames[Number(month) - 1] ? `${monthNames[Number(month) - 1]} ${year}` : period;
}

function formatDate(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function percentage(part: number, total: number) {
  if (!total) return '0%';
  return `${(part / total * 100).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;
}

function filenamePart(value: string) {
  return value.normalize('NFKD').replace(/[^\p{L}\p{N}.-]+/gu, '-').replace(/^-+|-+$/g, '');
}

function spell(value: number): string {
  if (value < 12) return words[value];
  if (value < 20) return `${spell(value - 10)} Belas`;
  if (value < 100) return `${spell(Math.floor(value / 10))} Puluh${value % 10 ? ` ${spell(value % 10)}` : ''}`;
  if (value < 200) return `Seratus${value > 100 ? ` ${spell(value - 100)}` : ''}`;
  if (value < 1_000) return `${spell(Math.floor(value / 100))} Ratus${value % 100 ? ` ${spell(value % 100)}` : ''}`;
  if (value < 2_000) return `Seribu${value > 1_000 ? ` ${spell(value - 1_000)}` : ''}`;
  if (value < 1_000_000) return `${spell(Math.floor(value / 1_000))} Ribu${value % 1_000 ? ` ${spell(value % 1_000)}` : ''}`;
  if (value < 1_000_000_000) return `${spell(Math.floor(value / 1_000_000))} Juta${value % 1_000_000 ? ` ${spell(value % 1_000_000)}` : ''}`;
  if (value < 1_000_000_000_000) return `${spell(Math.floor(value / 1_000_000_000))} Miliar${value % 1_000_000_000 ? ` ${spell(value % 1_000_000_000)}` : ''}`;
  return `${spell(Math.floor(value / 1_000_000_000_000))} Triliun${value % 1_000_000_000_000 ? ` ${spell(value % 1_000_000_000_000)}` : ''}`;
}

export function numberToIndonesianWords(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Nominal dokumen harus berupa bilangan bulat non-negatif.');
  return `${value === 0 ? 'Nol' : spell(value)} Rupiah`;
}

function documentNumber(form: 'F.010', recap: KordesVillageRecap) {
  const [year, month] = recap.period.split('-');
  return `${form}/${filenamePart(recap.village).toUpperCase()}/${romanMonths[Number(month) - 1] ?? month}/${year}`;
}

function recapBatches(recap: KordesVillageRecap, batches: CollectionBatch[]) {
  const byId = new Map(batches.map((batch) => [batch.id, batch]));
  return recap.plpkRows.map((row) => {
    const batch = byId.get(row.batchId);
    if (!batch) throw new Error(`Batch dokumen tidak ditemukan: ${row.batchId}`);
    if (batch.village !== recap.village || batch.kecamatan !== recap.kecamatan || batch.period !== recap.period) {
      throw new Error(`Batch ${batch.id} berada di luar cakupan rekap ${recap.id}.`);
    }
    return { row, batch };
  });
}

export function buildF009DocumentRequest(batch: CollectionBatch): DocumentRequest<'f009', F009DocumentData> {
  const periodLabel = formatPeriod(batch.period);
  return {
    documentType: 'f009',
    filename: `F.009-${filenamePart(batch.village)}-${filenamePart(batch.plpkName)}-${filenamePart(periodLabel)}.pdf`,
    data: {
      documentNumber: batch.f009DocumentNumber ?? batch.documentNumber,
      verificationStatus: batch.status === 'verified-by-kordes' ? 'Terverifikasi' : 'Belum Verifikasi',
      plpkName: batch.plpkName,
      plpkId: batch.plpkId,
      kecamatan: batch.kecamatan,
      village: batch.village,
      periodLabel,
      kordesName: batch.kordesName,
      activeCanCount: formatNumber(batch.activeCanCount),
      collectedCanCount: formatNumber(batch.collectedCanCount),
      uncollectedCanCount: formatNumber(batch.uncollectedCanCount),
      rows: batch.entries.map((entry, index) => ({
        index: String(index + 1),
        munfiqName: entry.munfiqName,
        canCode: entry.canCode,
        rt: entry.rt ?? '-',
        rw: entry.rw ?? '-',
        phone: entry.phone || '-',
        amount: formatNumber(entry.amount),
        status: visitStatusLabels[entry.visitStatus],
      })),
    },
  };
}

export function buildF010DocumentRequest(recap: KordesVillageRecap, batches: CollectionBatch[]): DocumentRequest<'f010', F010DocumentData> {
  const sources = recapBatches(recap, batches);
  const totals = sources.reduce((sum, { batch }) => ({
    active: sum.active + batch.activeCanCount,
    collected: sum.collected + batch.collectedCanCount,
    gross: sum.gross + batch.grossAmount,
    fee: sum.fee + batch.totalPlpkFee,
    net: sum.net + batch.netAmount,
  }), { active: 0, collected: 0, gross: 0, fee: 0, net: 0 });
  const periodLabel = formatPeriod(recap.period);
  return {
    documentType: 'f010',
    filename: `F.010-${filenamePart(recap.village)}-${filenamePart(periodLabel)}.pdf`,
    data: {
      documentNumber: documentNumber('F.010', recap),
      village: recap.village,
      kecamatan: recap.kecamatan,
      kordesName: recap.kordesName,
      periodLabel,
      fundraisingOfficerName,
      upzisOfficerName: recap.upzisOfficerName,
      rows: sources.map(({ row, batch }, index) => ({
        index: String(index + 1),
        plpkName: row.plpkName,
        active: formatNumber(batch.activeCanCount),
        collected: formatNumber(batch.collectedCanCount),
        percentage: percentage(batch.collectedCanCount, batch.activeCanCount),
        average: formatNumber(batch.collectedCanCount ? batch.grossAmount / batch.collectedCanCount : 0),
        gross: formatNumber(batch.grossAmount),
        fee: formatNumber(batch.totalPlpkFee),
        net: formatNumber(batch.netAmount),
        verifiedAt: row.verifiedAt ? formatDate(row.verifiedAt) : '-',
      })),
      totalActive: formatNumber(totals.active),
      totalCollected: formatNumber(totals.collected),
      totalPercentage: percentage(totals.collected, totals.active),
      totalAverage: formatNumber(totals.collected ? totals.gross / totals.collected : 0),
      totalGross: formatNumber(totals.gross),
      totalFee: formatNumber(totals.fee),
      totalNet: formatNumber(totals.net),
    },
  };
}

export function buildF015DocumentRequest(recap: KordesVillageRecap, batches: CollectionBatch[]): DocumentRequest<'f015', F015DocumentData> {
  const sources = recapBatches(recap, batches);
  const totals = sources.reduce((sum, { batch }) => ({
    active: sum.active + batch.activeCanCount,
    collected: sum.collected + batch.collectedCanCount,
    uncollected: sum.uncollected + batch.uncollectedCanCount,
    net: sum.net + batch.netAmount,
  }), { active: 0, collected: 0, uncollected: 0, net: 0 });
  return {
    documentType: 'f015',
    filename: `F.015-${filenamePart(recap.village)}-${filenamePart(formatPeriod(recap.period))}.pdf`,
    data: {
      documentNumber: recap.f015Number,
      handoverDate: formatDate(recap.handoverDate),
      handedBy: recap.kordesName,
      handedTo: recap.upzisOfficerName,
      totalNet: `Rp${formatNumber(totals.net)}`,
      totalWords: numberToIndonesianWords(totals.net),
      village: recap.village,
      kecamatan: recap.kecamatan,
      totalActive: formatNumber(totals.active),
      totalPlpk: formatNumber(sources.length),
      totalCollected: formatNumber(totals.collected),
      totalUncollected: formatNumber(totals.uncollected),
      verificationStatus: sources.every(({ row }) => row.status === 'verified-by-kordes') ? 'Data penerimaan terverifikasi' : 'Data penerimaan belum lengkap',
      fundraisingOfficerName,
      upzisOfficerName: recap.upzisOfficerName,
      kordesName: recap.kordesName,
    },
  };
}
