import type { CollectionBatch, CollectionStatus } from './types';

export const f009ConfirmedStatuses: CollectionStatus[] = [
  'waiting-kordes-verification',
  'needs-correction',
  'verified-by-kordes',
];

export function isF009Confirmed(batch: Pick<CollectionBatch, 'status' | 'confirmedByPlpkAt' | 'submittedToKordesAt'>): boolean {
  if (!f009ConfirmedStatuses.includes(batch.status)) return false;
  return Boolean(batch.confirmedByPlpkAt ?? batch.submittedToKordesAt);
}

export function f009Readiness(batch: Pick<CollectionBatch, 'status' | 'confirmedByPlpkAt' | 'submittedToKordesAt'>): 'ready' | 'waiting' | 'unavailable' {
  if (isF009Confirmed(batch)) return 'ready';
  if (batch.status === 'collecting' || batch.status === 'collection-completed' || batch.status === 'scheduled') return 'waiting';
  return 'unavailable';
}
