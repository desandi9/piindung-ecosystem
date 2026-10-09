import type { CollectionBatch, GorutMunfiq, KordesVerification } from './types';

export interface KordesScope {
  village: string;
  kecamatan: string;
  period?: string;
}

export interface KordesDecisionInput {
  moneyMatches?: boolean;
  hasDamagedMoney?: boolean;
  cashReceived?: boolean;
  notes?: string;
  correctionEntryIds?: string[];
}

export type KordesDecisionAction = 'verify' | 'correction';

export type KordesJournalStatus =
  | 'belum-lengkap'
  | 'menunggu-verifikasi'
  | 'siap-direkap'
  | 'f015-siap'
  | 'diserahkan-upzis';

export interface KordesJournalItem {
  period: string;
  batches: CollectionBatch[];
  plpkCount: number;
  munfiqCount: number;
  verified: number;
  corrections: number;
  grossAmount: number;
  totalPlpkFee: number;
  netAmount: number;
  recapStatus: KordesJournalStatus;
  f010Status: KordesDocumentReadiness['f010Status'];
  f015Ready: boolean;
}

export interface KordesDocumentReadiness {
  f009Count: number;
  f010Status: 'Belum Lengkap' | 'Menunggu Verifikasi' | 'Siap Dibuat';
  f010PreviewAvailable: boolean;
  f015Status: 'Belum Siap' | 'Siap';
  f015PreviewAvailable: boolean;
}

export interface KordesMunfiqDirectoryItem {
  id: string;
  name: string;
  memberId: string;
  phone: string;
  address: string;
  plpkName: string;
  lastAmount: number;
  lastVisitStatus?: CollectionBatch['entries'][number]['visitStatus'];
  canCode: string;
}

const queueStatuses: CollectionBatch['status'][] = [
  'waiting-kordes-verification',
  'verified-by-kordes',
  'needs-correction',
];

export function formatKordesSubmissionAge(value: string | undefined, now = new Date()): string {
  if (!value) return 'Waktu tidak tersedia';
  const submittedAt = new Date(value);
  if (Number.isNaN(submittedAt.getTime())) return 'Waktu tidak tersedia';
  const minutes = Math.max(0, Math.floor((now.getTime() - submittedAt.getTime()) / 60_000));
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function isInScope(batch: CollectionBatch, scope: KordesScope) {
  return batch.village === scope.village
    && batch.kecamatan === scope.kecamatan
    && (!scope.period || batch.period === scope.period);
}

export function batchToKordesVerification(batch: CollectionBatch): KordesVerification & { submittedAt?: string } {
  return {
    id: `kordes-${batch.id}`,
    batchId: batch.id,
    f009DocumentNumber: batch.f009DocumentNumber ?? batch.documentNumber,
    plpkId: batch.plpkId,
    plpkName: batch.plpkName,
    period: batch.period,
    kecamatan: batch.kecamatan,
    village: batch.village,
    kordesName: batch.kordesName,
    grossAmount: batch.grossAmount,
    totalPlpkFee: batch.totalPlpkFee,
    netAmount: batch.netAmount,
    status: batch.status as KordesVerification['status'],
    f015Status: batch.status === 'verified-by-kordes' ? 'f015-ready' : 'waiting-plpk-completion',
    moneyMatches: batch.kordesMoneyMatches,
    hasDamagedMoney: batch.kordesHasDamagedMoney,
    cashReceived: batch.kordesCashReceived,
    notes: batch.kordesNotes,
    verifiedAt: batch.verifiedByKordesAt,
    verifiedByKordesName: batch.verifiedByKordesName,
    submittedAt: batch.submittedToKordesAt,
  };
}

export function buildKordesQueue(batches: CollectionBatch[], scope: KordesScope) {
  return batches
    .filter((batch) => isInScope(batch, scope) && queueStatuses.includes(batch.status))
    .map(batchToKordesVerification);
}

/** Master Munfiq menjadi pagar wilayah; label batch saja tidak cukup aman. */
export function buildKordesMunfiqDirectory(
  batches: CollectionBatch[],
  munfiq: GorutMunfiq[],
  scope: Omit<KordesScope, 'period'>,
): KordesMunfiqDirectoryItem[] {
  const entries = batches
    .filter((batch) => isInScope(batch, scope))
    .slice()
    .sort((a, b) => b.period.localeCompare(a.period) || b.createdAt.localeCompare(a.createdAt))
    .flatMap((batch) => batch.entries);

  return munfiq
    .filter((item) => item.village === scope.village && item.kecamatan === scope.kecamatan)
    .map((item) => {
      const latestEntry = entries.find((entry) => entry.munfiqId === item.id);
      return {
        id: item.id,
        name: item.name,
        memberId: item.memberId,
        phone: item.phone,
        address: item.address,
        plpkName: item.plpkName,
        lastAmount: latestEntry?.amount ?? item.lastDepositAmount ?? 0,
        lastVisitStatus: latestEntry?.visitStatus,
        canCode: latestEntry?.canCode ?? `KLG-${item.memberId.replace('GOR-MQ-', '')}`,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

export function summarizeKordesPeriod(batches: CollectionBatch[], scope: Required<KordesScope>) {
  const rows = batches.filter((batch) => isInScope(batch, scope));
  const submitted = rows.filter((batch) => queueStatuses.includes(batch.status));
  const verified = submitted.filter((batch) => batch.status === 'verified-by-kordes').length;

  return {
    activePlpk: new Set(rows.map((batch) => batch.plpkId)).size,
    submittedPlpk: new Set(submitted.map((batch) => batch.plpkId)).size,
    waiting: submitted.filter((batch) => batch.status === 'waiting-kordes-verification').length,
    verified,
    corrections: submitted.filter((batch) => batch.status === 'needs-correction').length,
    grossAmount: submitted.reduce((total, batch) => total + batch.grossAmount, 0),
    progress: submitted.length ? Math.round((verified / submitted.length) * 100) : 0,
  };
}

export function validateKordesAction(input: KordesDecisionInput, action: KordesDecisionAction) {
  if (input.moneyMatches === undefined || input.hasDamagedMoney === undefined || input.cashReceived === undefined) {
    return 'Semua pertanyaan verifikasi wajib dijawab.';
  }
  if (action === 'correction') {
    if (!input.notes?.trim()) return 'Catatan koreksi wajib diisi.';
    if (!input.correctionEntryIds?.length) return 'Pilih minimal satu Munfiq yang perlu dikoreksi.';
    return null;
  }

  if (!input.moneyMatches) return 'Jumlah uang harus sesuai untuk menyelesaikan verifikasi.';
  if (!input.cashReceived) return 'Uang harus sudah diterima sebelum verifikasi diselesaikan.';
  if (input.hasDamagedMoney && !input.notes?.trim()) return 'Catatan wajib diisi untuk uang rusak.';
  return null;
}

export function applyKordesDecision(
  source: CollectionBatch,
  input: KordesDecisionInput,
  action: KordesDecisionAction,
  kordesName: string,
  decidedAt = new Date().toISOString(),
): { batch?: CollectionBatch; error?: string } {
  if (source.status === 'verified-by-kordes') {
    return { error: 'Data ini sudah terverifikasi dan tidak dapat diverifikasi ulang.' };
  }
  if (source.status !== 'waiting-kordes-verification') {
    return { error: 'Data belum dikirim PLPK atau masih dalam proses koreksi.' };
  }

  const error = validateKordesAction(input, action);
  if (error) return { error };

  const validEntryIds = new Set(source.entries.map((entry) => entry.id));
  const correctionEntryIds = input.correctionEntryIds?.filter((id) => validEntryIds.has(id)) ?? [];
  if (action === 'correction' && !correctionEntryIds.length) {
    return { error: 'Pilih minimal satu Munfiq yang perlu dikoreksi.' };
  }

  return {
    batch: {
      ...source,
      status: action === 'verify' ? 'verified-by-kordes' : 'needs-correction',
      kordesNotes: input.notes?.trim() || undefined,
      kordesMoneyMatches: input.moneyMatches,
      kordesHasDamagedMoney: input.hasDamagedMoney,
      kordesCashReceived: input.cashReceived,
      correctionEntryIds: action === 'correction' ? correctionEntryIds : undefined,
      verifiedByKordesAt: action === 'verify' ? decidedAt : undefined,
      verifiedByKordesName: kordesName,
      returnedForCorrectionAt: action === 'correction' ? decidedAt : undefined,
      lockedAt: decidedAt,
    },
  };
}

export function isKordesF015Ready(batches: CollectionBatch[]) {
  return batches.length > 0 && batches.every((batch) => batch.status === 'verified-by-kordes');
}

export function getKordesDocumentReadiness(batches: CollectionBatch[]): KordesDocumentReadiness {
  const submitted = batches.filter((batch) => queueStatuses.includes(batch.status));
  const complete = batches.length > 0 && submitted.length === batches.length;
  const verified = complete && isKordesF015Ready(batches);
  return {
    f009Count: submitted.length,
    f010Status: !complete ? 'Belum Lengkap' : verified ? 'Siap Dibuat' : 'Menunggu Verifikasi',
    f010PreviewAvailable: complete,
    f015Status: verified ? 'Siap' : 'Belum Siap',
    f015PreviewAvailable: verified,
  };
}

export function buildKordesJournal(batches: CollectionBatch[], scope: Omit<KordesScope, 'period'>): KordesJournalItem[] {
  const groups = new Map<string, CollectionBatch[]>();
  for (const batch of batches.filter((item) => isInScope(item, scope))) {
    groups.set(batch.period, [...(groups.get(batch.period) ?? []), batch]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([period, rows]) => {
      const verified = rows.filter((batch) => batch.status === 'verified-by-kordes').length;
      const corrections = rows.filter((batch) => batch.status === 'needs-correction').length;
      const f015Ready = isKordesF015Ready(rows);
      const documents = getKordesDocumentReadiness(rows);
      const hasCollecting = rows.some((batch) => !queueStatuses.includes(batch.status));
      const recapStatus: KordesJournalStatus = f015Ready
        ? 'f015-siap'
        : hasCollecting
          ? 'belum-lengkap'
          : verified === rows.length
            ? 'siap-direkap'
            : 'menunggu-verifikasi';

      return {
        period,
        batches: rows,
        plpkCount: new Set(rows.map((batch) => batch.plpkId)).size,
        munfiqCount: rows.reduce((total, batch) => total + batch.activeCanCount, 0),
        verified,
        corrections,
        grossAmount: rows.reduce((total, batch) => total + batch.grossAmount, 0),
        totalPlpkFee: rows.reduce((total, batch) => total + batch.totalPlpkFee, 0),
        netAmount: rows.reduce((total, batch) => total + batch.netAmount, 0),
        recapStatus,
        f010Status: documents.f010Status,
        f015Ready,
      };
    });
}
