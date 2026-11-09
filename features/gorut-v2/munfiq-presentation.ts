/** Presentation of the existing own-collection DTO. No operational finance enters this model. */
export type MunfiqCollection = {
  collectionCode: string;
  periodStart: string;
  amount: string;
  currency: 'IDR';
  status: string | null;
  statusAt: string | null;
  historicalPlpk: { code: string; name: string };
  location: { ranting: string; kecamatan: string };
  timeline: Array<{ key: string; label: string; at: string }>;
};

export type MunfiqCollectionsResponse = {
  owner: { munfiqCode: string; name: string };
  summary: { collectionCount: number; totalAmount: string; currency: 'IDR' };
  collections: MunfiqCollection[];
};

export function collectionFact(item: MunfiqCollection, key: string) {
  return item.timeline.find((fact) => fact.key === key && Number.isFinite(Date.parse(fact.at)));
}

export function recordedOwnAmount(item: MunfiqCollection): string | null {
  // A status label, amount, or later batch milestone alone is not evidence of a PLPK recording.
  if (!collectionFact(item, 'recorded') || collectionFact(item, 'pending')) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(item.amount) || !/[1-9]/.test(item.amount)) return null;
  const [whole, cents = '00'] = item.amount.split('.');
  const grouped = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${grouped}${/^0+$/.test(cents) ? '' : `,${cents.padEnd(2, '0')}`}`;
}

export function munfiqDate(value: string, mode: 'period' | 'date' | 'time' = 'date') {
  if (!Number.isFinite(Date.parse(value))) return 'Tanggal belum tersedia';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    ...(mode === 'period' ? { month: 'long', year: 'numeric' } as const
      : mode === 'time' ? { dateStyle: 'medium', timeStyle: 'short' } as const
      : { day: 'numeric', month: 'short', year: 'numeric' } as const),
  }).format(new Date(value));
}

export const munfiqStages = [
  { key: 'recorded', label: 'Infak dicatat PLPK' },
  { key: 'verifying', label: 'Verifikasi Kordes' },
  { key: 'verified', label: 'Sudah diverifikasi Kordes' },
  { key: 'upzis', label: 'Diproses UPZIS' },
  { key: 'pc', label: 'Diteruskan ke PC' },
  { key: 'complete', label: 'Proses penghimpunan selesai' },
] as const;
