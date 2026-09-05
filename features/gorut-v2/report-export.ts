import type { OpsRegionRow } from './ops-monitoring';

const headers = ['Periode', 'Kecamatan', 'Desa/Ranting', 'Jumlah PLPK', 'Jumlah Batch', 'Jumlah Kotor', 'Bisyaroh PLPK', 'Jumlah Bersih', 'Status Proses'];

export function buildReportFilename(period: string) {
  const safePeriod = period === 'all'
    ? 'semua-periode'
    : period.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'semua-periode';
  return `laporan-gorut-${safePeriod}.csv`;
}

function csvCell(value: string | number) {
  const text = typeof value === 'string' && /^[=+\-@]/.test(value) ? `'${value}` : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildReportCsv(rows: OpsRegionRow[]) {
  return [
    headers,
    ...rows.map((row) => [
      row.periodLabel,
      row.kecamatan,
      row.village,
      row.plpkCount,
      row.batchCount,
      row.grossAmount,
      row.totalPlpkFee,
      row.netAmount,
      row.processLabel,
    ]),
  ].map((row) => row.map(csvCell).join(',')).join('\n');
}
