// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { formatRupiah } from './formatters.ts';
import type { CollectionBatch, CollectionEntry, CollectionStatus, CollectionVisitStatus } from './types';
import type { GorutCollection, GorutCollectionStatus, GorutCollectionVisitStatus } from './collection-api-client';

const statusMap: Record<GorutCollectionStatus, CollectionStatus> = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  COLLECTING: 'collecting',
  COLLECTION_COMPLETED: 'collection-completed',
  WAITING_KORDES_VERIFICATION: 'waiting-kordes-verification',
  VERIFIED_BY_KORDES: 'verified-by-kordes',
  NEEDS_CORRECTION: 'needs-correction',
};

const visitStatusMap: Record<GorutCollectionVisitStatus, CollectionVisitStatus> = {
  PENDING: 'pending',
  COLLECTED: 'collected',
  NOT_AROUND: 'not-around',
  NOT_READY: 'not-ready',
  DECLINED: 'declined',
  DAMAGED_LOST: 'damaged-lost',
};

export type ServerCollectionBatch = CollectionBatch & {
  dataMode: 'server';
  canonical: GorutCollection;
};

function displayNumber(value: string | null) {
  if (value === null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function entryView(entry: GorutCollection['entries'][number]): CollectionEntry {
  return {
    id: entry.munfiq.code,
    munfiqId: entry.munfiq.code,
    munfiqName: entry.munfiq.name,
    memberId: entry.munfiq.code,
    canCode: entry.munfiq.code,
    phone: '',
    address: '',
    rt: '—',
    rw: '—',
    isActive: true,
    canCount: 1,
    amount: displayNumber(entry.amount),
    visitStatus: visitStatusMap[entry.visitStatus],
    collectedAt: entry.collectedAt ?? '',
    eligibleForPlpkFee: entry.fee.eligible === true,
    plpkFee: displayNumber(entry.fee.amount),
    notes: entry.note ?? undefined,
  };
}

export function collectionToBatch(collection: GorutCollection): ServerCollectionBatch {
  const entries = collection.entries.map(entryView);
  const visitedCount = entries.filter((entry) => entry.visitStatus !== 'pending').length;
  const collectedCanCount = entries.filter((entry) => entry.visitStatus === 'collected').length;
  const uncollectedCanCount = entries.filter((entry) => entry.visitStatus !== 'pending' && entry.visitStatus !== 'collected').length;
  const openCorrections = collection.corrections.filter((correction) => !correction.resolvedAt);

  return {
    id: collection.identity.collectionCode,
    period: collection.period.key,
    plpkId: collection.plpk.code,
    plpkName: collection.plpk.name,
    village: collection.region.ranting.name,
    kecamatan: collection.region.kecamatan.name,
    kordesName: collection.kordesVerification.decisionBy?.name ?? 'Kordes',
    entries,
    activeCanCount: entries.length,
    visitedCount,
    pendingCount: entries.length - visitedCount,
    collectedCanCount,
    uncollectedCanCount,
    grossAmount: displayNumber(collection.financial.grossAmount),
    totalCollected: displayNumber(collection.financial.grossAmount),
    eligibleMunfiqCount: entries.filter((entry) => entry.eligibleForPlpkFee).length,
    totalPlpkFee: displayNumber(collection.financial.totalPlpkFee),
    netAmount: displayNumber(collection.financial.netAmount),
    formCode: 'F.009',
    documentNumber: collection.identity.collectionCode,
    documentStatus: collection.confirmation.confirmedByPlpkAt ? 'Siap' : 'Draft',
    status: statusMap[collection.identity.status],
    confirmedByPlpkAt: collection.confirmation.confirmedByPlpkAt ?? undefined,
    lockedAt: collection.availableActions.includes('RECORD_ENTRY') ? undefined : collection.identity.updatedAt,
    f009DocumentNumber: collection.confirmation.confirmedByPlpkAt ? collection.identity.collectionCode : undefined,
    submittedToKordesAt: collection.confirmation.submittedToKordesAt ?? undefined,
    verifiedByKordesAt: collection.kordesVerification.verifiedByKordesAt ?? undefined,
    verifiedByKordesName: collection.kordesVerification.decisionBy?.name,
    returnedForCorrectionAt: collection.kordesVerification.returnedForCorrectionAt ?? undefined,
    kordesNotes: openCorrections.at(-1)?.reason ?? collection.kordesVerification.note ?? undefined,
    correctionEntryIds: openCorrections.map((correction) => correction.target.code),
    kordesMoneyMatches: collection.kordesVerification.moneyMatches ?? undefined,
    kordesHasDamagedMoney: collection.kordesVerification.hasDamagedMoney ?? undefined,
    kordesCashReceived: collection.kordesVerification.cashReceived ?? undefined,
    createdAt: collection.identity.createdAt,
    dataMode: 'server',
    canonical: collection,
  };
}

export function isServerCollectionBatch(batch: CollectionBatch): batch is ServerCollectionBatch {
  return 'dataMode' in batch && batch.dataMode === 'server' && 'canonical' in batch;
}

export function collectionMoneyLabel(batch: CollectionBatch, field: 'grossAmount' | 'totalPlpkFee' | 'netAmount') {
  if (!isServerCollectionBatch(batch)) return formatRupiah(batch[field]);
  if (batch.canonical.financial.status !== 'READY') return 'Belum siap';
  const value = batch.canonical.financial[field];
  return value === null ? 'Belum siap' : formatRupiah(displayNumber(value));
}

export function collectionHasAction(batch: CollectionBatch, action: GorutCollection['availableActions'][number]) {
  return isServerCollectionBatch(batch) ? batch.canonical.availableActions.includes(action) : undefined;
}

export function entryHasRecordAction(batch: CollectionBatch, entryId: string) {
  if (!isServerCollectionBatch(batch)) return undefined;
  return batch.canonical.entries.find((entry) => entry.munfiq.code === entryId)?.availableActions.includes('RECORD_ENTRY') ?? false;
}

export function collectionPolicyLabel(batch: CollectionBatch) {
  if (!isServerCollectionBatch(batch)) return null;
  const { calculationPolicyVersion, policyAuthority } = batch.canonical.financial;
  if (!calculationPolicyVersion) return null;
  return policyAuthority ? `${policyAuthority} · ${calculationPolicyVersion}` : calculationPolicyVersion;
}

const blockingReasonLabels: Record<string, string> = {
  PROVISIONAL_FEE_POLICY_DISABLED: 'Kebijakan biaya sementara tidak aktif pada environment ini.',
  COLLECTION_STATE_LOCKED: 'Collection sudah terkunci untuk perubahan.',
  COLLECTION_ENTRIES_EMPTY: 'Collection belum memiliki data Munfiq.',
  COLLECTION_ENTRY_PENDING: 'Masih ada Munfiq yang belum memiliki hasil kunjungan.',
  COLLECTION_AMOUNT_INVALID: 'Ada nominal collection yang belum valid.',
  OPEN_COLLECTION_CORRECTION: 'Koreksi dari Kordes masih terbuka.',
  NOT_WAITING_KORDES_VERIFICATION: 'Collection tidak berada dalam antrean verifikasi Kordes.',
  PLPK_SCOPE_REQUIRED: 'Collection berada di luar penugasan PLPK.',
  KORDES_SCOPE_REQUIRED: 'Collection berada di luar penugasan Kordes.',
  COLLECTION_READ_ONLY_ROLE: 'Peran ini hanya memiliki akses baca.',
};

export function collectionBlockingReasonLabel(reason: string) {
  return blockingReasonLabels[reason] ?? reason.replaceAll('_', ' ').toLocaleLowerCase('id-ID');
}
