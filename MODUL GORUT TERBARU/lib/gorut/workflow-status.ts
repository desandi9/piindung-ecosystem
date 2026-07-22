export const gorutTransactionStateLabels: Record<string, string> = {
  DRAFT: 'Draft',
  WAITING_RANTING_VERIFICATION: 'Menunggu Verifikasi Ranting',
  RETURNED_TO_PLPK: 'Dikembalikan ke PLPK',
  WAITING_UPZIS_VERIFICATION: 'Menunggu Verifikasi UPZIS',
  RETURNED_TO_RANTING: 'Dikembalikan ke Ranting',
  WAITING_PC_APPROVAL: 'Menunggu Approval PC',
  RETURNED_TO_UPZIS: 'Dikembalikan ke UPZIS',
  FINAL_APPROVED: 'Selesai',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
}

export function getGorutTransactionStateLabel(state: string) {
  return gorutTransactionStateLabels[state] ?? state.replace(/_/g, ' ')
}

export function getGorutTransactionStateClassName(state: string) {
  if (state === 'FINAL_APPROVED') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600'
  if (state === 'REJECTED' || state === 'CANCELLED') return 'border-red-500/25 bg-red-500/10 text-red-600'
  if (state.startsWith('RETURNED')) return 'border-amber-500/25 bg-amber-500/10 text-amber-600'
  if (state === 'DRAFT') return 'border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300'
  if (state === 'WAITING_PC_APPROVAL') return 'border-violet-500/25 bg-violet-500/10 text-violet-600'
  return 'border-blue-500/25 bg-blue-500/10 text-blue-600'
}
