import type { CollectionBatch, UpzisPlpkBreakdown, UpzisRecapStatus, UpzisVillageRecap } from './types';
import { gorutCollectionBatches } from './pengambilan-mock-data';
import { summarizeBreakdown } from './upzis-options';

/**
 * Rekap UPZIS diturunkan dari batch penghimpunan Kordes, bukan ditulis ulang.
 * Dengan begitu angka di halaman Kordes dan UPZIS tidak pernah berbeda.
 */

/** Kordes penanggung jawab per kecamatan. */
const kordesByKecamatan: Record<string, string> = {
  'Garut Kota': 'Ceng Rahmat',
  'Tarogong Kidul': 'Nunung Fatimah',
  Karangpawitan: 'Encep Wahyudi',
  Cilawu: 'Popon Sumiati',
};

/** Nomor berita acara hanya ada untuk desa yang sudah melewati tahap rekap. */
const minutesByGroup: Record<string, string> = {
  '2026-05|Paminggir': 'BA/UPZIS/2026-05/001',
  '2026-05|Sukakarya': 'BA/UPZIS/2026-05/002',
  '2026-05|Dayeuhmanggung': 'BA/UPZIS/2026-05/003',
  '2026-04|Sukamentri': 'BA/UPZIS/2026-04/001',
  '2026-04|Sindangpalay': 'BA/UPZIS/2026-04/002',
  '2026-04|Haurpanggung': 'BA/UPZIS/2026-04/003',
  '2026-03|Dawungsari': 'BA/UPZIS/2026-03/001',
};

/**
 * Status rekap desa ditentukan dari status batch PLPK di dalamnya:
 * - ada batch yang belum selesai diambil  → Belum Lengkap
 * - semua selesai tapi belum diverifikasi → Siap Direkap
 * - sudah diverifikasi, belum ada BA      → Sudah Direkap / Menunggu Berita Acara
 * - sudah diverifikasi dan BA terbit      → Siap Disetor
 */
function deriveStatus(batches: CollectionBatch[], hasMinutes: boolean): UpzisRecapStatus {
  const anyUnfinished = batches.some((batch) => ['draft', 'scheduled', 'collecting', 'collection-completed', 'needs-correction'].includes(batch.status));
  if (anyUnfinished) return 'incomplete';

  const allVerified = batches.every((batch) => batch.status === 'verified-by-kordes');
  if (!allVerified) return 'ready-to-recap';

  if (hasMinutes) return 'ready-to-deposit';

  return 'recapped';
}

function buildBreakdown(batches: CollectionBatch[]): UpzisPlpkBreakdown[] {
  const byPlpk = new Map<string, UpzisPlpkBreakdown>();

  batches.forEach((batch) => {
    const existing = byPlpk.get(batch.plpkId);
    if (existing) {
      existing.munfiqCount += batch.entries.length;
      existing.totalCollected += batch.totalCollected;
      existing.eligibleMunfiqCount += batch.eligibleMunfiqCount;
      existing.totalPlpkFee += batch.totalPlpkFee;
      return;
    }
    byPlpk.set(batch.plpkId, {
      plpkId: batch.plpkId,
      plpkName: batch.plpkName,
      munfiqCount: batch.entries.length,
      totalCollected: batch.totalCollected,
      eligibleMunfiqCount: batch.eligibleMunfiqCount,
      totalPlpkFee: batch.totalPlpkFee,
    });
  });

  return [...byPlpk.values()].sort((a, b) => a.plpkName.localeCompare(b.plpkName, 'id-ID'));
}

function buildRecaps(): UpzisVillageRecap[] {
  const groups = new Map<string, CollectionBatch[]>();

  gorutCollectionBatches.forEach((batch) => {
    const key = `${batch.period}|${batch.village}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(batch);
    else groups.set(key, [batch]);
  });

  const recaps = [...groups.entries()].map(([key, batches], index) => {
    const [period, village] = key.split('|');
    const kecamatan = batches[0].kecamatan;
    const breakdown = buildBreakdown(batches);
    const minutesNumber = minutesByGroup[key];
    const status = deriveStatus(batches, Boolean(minutesNumber));
    const latestCreatedAt = batches.map((batch) => batch.createdAt).sort().at(-1);

    return {
      id: `upzis-${String(index + 1).padStart(3, '0')}`,
      period,
      village,
      kecamatan,
      kordesName: kordesByKecamatan[kecamatan] ?? '—',
      plpkBreakdown: breakdown,
      ...summarizeBreakdown(breakdown),
      status,
      minutesNumber,
      recappedAt: status === 'incomplete' || status === 'ready-to-recap' ? undefined : latestCreatedAt,
    } satisfies UpzisVillageRecap;
  });

  // Periode terbaru di atas, lalu desa menurut abjad.
  return recaps.sort((a, b) => (a.period === b.period ? a.village.localeCompare(b.village, 'id-ID') : b.period.localeCompare(a.period)));
}

export const gorutUpzisRecaps: UpzisVillageRecap[] = buildRecaps();

/** Desa unik untuk opsi filter, diambil dari data yang benar-benar ada. */
export const upzisVillageOptions = ['Semua Desa', ...[...new Set(gorutUpzisRecaps.map((recap) => recap.village))].sort((a, b) => a.localeCompare(b, 'id-ID'))];

export const currentUpzisPeriod = '2026-07';
