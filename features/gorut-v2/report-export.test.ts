import assert from 'node:assert/strict';
import test from 'node:test';

// @ts-expect-error Node executes TypeScript directly in this repository.
import { buildReportCsv, buildReportFilename } from './report-export.ts';
import type { OpsRegionRow } from './ops-monitoring';

const rows: OpsRegionRow[] = [
  {
    id: '2026-07-cikajang-mekarjaya',
    period: '2026-07',
    periodLabel: 'Juli 2026',
    kecamatan: 'Cikajang',
    village: 'Mekarjaya',
    plpkCount: 2,
    batchCount: 3,
    grossAmount: 125_000,
    totalPlpkFee: 15_000,
    netAmount: 110_000,
    processLabel: 'Menunggu Kordes',
    processTone: 'waiting',
  },
  {
    id: '2026-07-garut-kota-paminggir',
    period: '2026-07',
    periodLabel: 'Juli 2026',
    kecamatan: 'Garut Kota',
    village: 'Paminggir, Kota',
    plpkCount: 1,
    batchCount: 1,
    grossAmount: 33_000,
    totalPlpkFee: 5_000,
    netAmount: 28_000,
    processLabel: 'Terverifikasi Kordes',
    processTone: 'verified',
  },
];

test('report CSV exports visible regional totals and safely quotes commas', () => {
  assert.equal(
    buildReportCsv(rows),
    [
      'Periode,Kecamatan,Desa/Ranting,Jumlah PLPK,Jumlah Batch,Jumlah Kotor,Bisyaroh PLPK,Jumlah Bersih,Status Proses',
      'Juli 2026,Cikajang,Mekarjaya,2,3,125000,15000,110000,Menunggu Kordes',
      'Juli 2026,Garut Kota,"Paminggir, Kota",1,1,33000,5000,28000,Terverifikasi Kordes',
    ].join('\n'),
  );
});

test('report CSV keeps a useful header when filters have no rows', () => {
  assert.equal(
    buildReportCsv([]),
    'Periode,Kecamatan,Desa/Ranting,Jumlah PLPK,Jumlah Batch,Jumlah Kotor,Bisyaroh PLPK,Jumlah Bersih,Status Proses',
  );
});

test('report CSV neutralizes formula-prefixed text without changing numeric amounts', () => {
  const unsafeRow = {
    ...rows[0],
    periodLabel: '@Juli 2026',
    kecamatan: '+SUM(A1:A2)',
    village: '=HYPERLINK("https://example.test")',
    processLabel: '-Status',
    netAmount: -110_000,
  };

  assert.equal(
    buildReportCsv([unsafeRow]).split('\n')[1],
    "'@Juli 2026,'+SUM(A1:A2),\"'=HYPERLINK(\"\"https://example.test\"\")\",2,3,125000,15000,-110000,'-Status",
  );
});

test('report CSV quotes carriage returns and newlines', () => {
  const multilineRow = {
    ...rows[0],
    kecamatan: 'Garut\rKota',
    village: 'Mekar\nJaya',
  };

  assert.equal(
    buildReportCsv([multilineRow]).split('\n').slice(1).join('\n'),
    'Juli 2026,"Garut\rKota","Mekar\nJaya",2,3,125000,15000,110000,Menunggu Kordes',
  );
});

test('report filename is stable and strips unsafe period characters', () => {
  assert.equal(buildReportFilename('all'), 'laporan-gorut-semua-periode.csv');
  assert.equal(buildReportFilename('2026-07'), 'laporan-gorut-2026-07.csv');
  assert.equal(buildReportFilename('../../Juli 2026\r\n.csv'), 'laporan-gorut-juli-2026-csv.csv');
});
