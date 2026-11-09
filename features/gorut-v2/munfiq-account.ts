import type { AccountProfile, ProfilePatch } from '@/lib/account-profile';
import { collectionFact, recordedOwnAmount, type MunfiqCollection } from './munfiq-presentation';

export function munfiqAccountSummary(collections: MunfiqCollection[]) {
  let total = BigInt(0);
  let recorded = 0;
  let pending = 0;
  for (const item of collections) {
    if (collectionFact(item, 'pending')) pending += 1;
    if (!recordedOwnAmount(item)) continue;
    const [whole, cents = ''] = item.amount.split('.');
    total += BigInt(whole) * BigInt(100) + BigInt(cents.padEnd(2, '0'));
    recorded += 1;
  }
  const whole = (total / BigInt(100)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const cents = total % BigInt(100);
  return { recorded, pending, total: recorded ? `Rp${whole}${cents ? `,${cents.toString().padStart(2, '0')}` : ''}` : 'Belum ada nominal tercatat' };
}

export type MunfiqProfileDraft = Pick<AccountProfile, 'name' | 'email' | 'phone' | 'address'>;

// Only send edited self-service fields. An untouched empty email is allowed in existing profiles.
export function munfiqProfilePatch(profile: MunfiqProfileDraft, draft: MunfiqProfileDraft): ProfilePatch {
  const patch: ProfilePatch = {};
  for (const field of ['name', 'email', 'phone', 'address'] as const) {
    if (draft[field].trim() !== profile[field].trim()) patch[field] = draft[field].trim();
  }
  return patch;
}
