export type GorutTransactionState =
  | 'DRAFT'
  | 'WAITING_RANTING_VERIFICATION'
  | 'RETURNED_TO_PLPK'
  | 'WAITING_UPZIS_VERIFICATION'
  | 'RETURNED_TO_RANTING'
  | 'WAITING_PC_APPROVAL'
  | 'RETURNED_TO_UPZIS'
  | 'FINAL_APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type GorutTransactionRow = {
  transactionCode: string;
  transactionDate: string;
  totalAmount: number;
  currentState: GorutTransactionState;
  kecamatan: string;
  ranting: string;
  plpk: string;
  munfiqCount: number;
};

export type GorutTransactionResponse = {
  items: GorutTransactionRow[];
  transactions?: GorutTransactionRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type TransactionStatusTone = 'success' | 'waiting' | 'returned' | 'neutral';

export const transactionStatusPresentation: Record<GorutTransactionState, { label: string; tone: TransactionStatusTone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  WAITING_RANTING_VERIFICATION: { label: 'Menunggu Ranting', tone: 'waiting' },
  RETURNED_TO_PLPK: { label: 'Dikembalikan ke PLPK', tone: 'returned' },
  WAITING_UPZIS_VERIFICATION: { label: 'Menunggu UPZIS', tone: 'waiting' },
  RETURNED_TO_RANTING: { label: 'Dikembalikan ke Ranting', tone: 'returned' },
  WAITING_PC_APPROVAL: { label: 'Menunggu PC', tone: 'waiting' },
  RETURNED_TO_UPZIS: { label: 'Dikembalikan ke UPZIS', tone: 'returned' },
  FINAL_APPROVED: { label: 'Disetujui Final', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'returned' },
  CANCELLED: { label: 'Dibatalkan', tone: 'neutral' },
};

export const transactionStateOptions = (Object.entries(transactionStatusPresentation) as Array<[
  GorutTransactionState,
  { label: string; tone: TransactionStatusTone },
]>).map(([value, presentation]) => ({ value, label: presentation.label }));

export function transactionPeriod(value: string) {
  return value.slice(0, 7);
}

export function formatTransactionPeriod(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatTransactionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function formatTransactionDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
