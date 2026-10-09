import type {
  GorutPackageAction,
  GorutPackageDetail,
  GorutPackageReturnReasonCode,
  GorutPackageState,
  GorutPackageSummary,
} from './package-api-client';

export const packageStateLabels: Record<GorutPackageState, string> = {
  DRAFT: 'Draft package',
  WAITING_UPZIS_VERIFICATION: 'Menunggu verifikasi UPZIS',
  RETURNED_TO_RANTING: 'Dikembalikan ke Ranting',
  WAITING_PC_APPROVAL: 'Diteruskan ke proses PC',
  RETURNED_TO_UPZIS: 'Dikembalikan ke UPZIS',
  FINAL_APPROVED: 'Final disetujui',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

export const packageActionLabels: Record<GorutPackageAction, string> = {
  SUBMIT: 'Kirim untuk verifikasi',
  APPROVE: 'Teruskan ke proses PC',
  RETURN: 'Kembalikan untuk koreksi',
};

const blockingReasonLabels: Record<string, string> = {
  PACKAGE_FINANCIAL_NOT_READY: 'Financial package belum READY.',
  PACKAGE_FINANCIAL_RECONCILIATION_FAILED: 'Rekonsiliasi financial package belum sesuai.',
  PACKAGE_GROSS_SOURCE_MISMATCH: 'Total penghimpunan tidak sesuai dengan sumber collection.',
  PACKAGE_FEE_SOURCE_MISMATCH: 'Bisyaroh PLPK tidak sesuai dengan sumber collection.',
  COLLECTION_FINANCIAL_NOT_READY: 'Financial collection belum READY.',
  COLLECTION_FINANCIAL_RECONCILIATION_FAILED: 'Financial collection belum terrekonsiliasi.',
  COLLECTION_AMOUNT_RECONCILIATION_FAILED: 'Nominal collection belum terrekonsiliasi.',
  COLLECTION_NOT_VERIFIED_BY_KORDES: 'Collection belum diverifikasi Kordes.',
  KORDES_VERIFICATION_FACT_MISSING: 'Fakta verifikasi Kordes belum lengkap.',
  PLPK_CONFIRMATION_MISSING: 'Konfirmasi PLPK belum tersedia.',
  KORDES_SUBMISSION_MISSING: 'Pengiriman ke Kordes belum tersedia.',
  OPEN_COLLECTION_CORRECTION: 'Koreksi collection masih terbuka.',
  OPEN_PACKAGE_CORRECTIONS: 'Koreksi package masih terbuka.',
  PACKAGE_CORRECTION_UNRESOLVED: 'Koreksi package belum selesai.',
  PACKAGE_CORRECTION_SOURCE_UNCHANGED: 'Sumber koreksi belum berubah dan belum siap dikirim ulang.',
  ROSTER_COVERAGE_INCOMPLETE: 'Coverage Ranting belum lengkap.',
  UNRESOLVED_COVERAGE: 'Masih ada coverage Ranting yang belum terpetakan.',
  EXCLUSION_AUDIT_INCOMPLETE: 'Catatan pengecualian Ranting belum lengkap.',
  INCLUDED_COVERAGE_WITHOUT_SOURCE: 'Coverage included belum memiliki sumber transaksi.',
  TRANSACTION_WITHOUT_INCLUDED_COVERAGE: 'Transaksi belum tercakup sebagai Ranting included.',
  COLLECTION_SOURCE_HASH_DRIFT: 'Sumber collection berubah dan perlu rekonsiliasi.',
  PACKAGE_MEMBERSHIP_SOURCE_DRIFT: 'Membership package tidak selaras dengan sumber terbaru.',
  TRANSACTION_RECORDED_AMOUNT_DRIFT: 'Jumlah tercatat transaksi berubah dari sumber.',
  TRANSACTION_ITEM_RECONCILIATION_FAILED: 'Rincian transaksi belum terrekonsiliasi.',
  CANONICAL_HIERARCHY_INVALID: 'Hierarki sumber belum canonical.',
  MAKER_CHECKER_REQUIRED: 'Pembuat pengajuan tidak boleh menyetujui package yang sama. Diperlukan petugas UPZIS kedua.',
  PROVISIONAL_FEE_POLICY_DISABLED: 'Kebijakan sementara UAT tidak aktif pada environment ini.',
  PROVISIONAL_FEE_POLICY_VERSION_REQUIRED: 'Versi kebijakan sementara financial tidak sesuai.',
  UPZIS_SCOPE_REQUIRED: 'Aksi memerlukan assignment UPZIS pada Kecamatan package.',
  PACKAGE_TRANSACTIONS_EMPTY: 'Package belum memiliki transaksi.',
  PACKAGE_STATE_MISSING: 'State package belum tersedia.',
  TECHNICAL_TRANSACTION_STATE_INVALID: 'State technical transaction belum valid.',
  AUTHORITATIVE_COLLECTION_SOURCE_MISSING: 'Sumber authoritative collection belum tersedia.',
  COLLECTION_AMOUNT_NOT_AUTHORITATIVE: 'Nominal collection belum authoritative.',
  COLLECTION_FEE_NOT_AUTHORITATIVE: 'Bisyaroh collection belum authoritative.',
  WORKFLOW_AVAILABILITY_UNAVAILABLE: 'Ketersediaan aksi belum dapat dibaca dari server.',
  SETTLEMENT_REQUIRED: 'Belum ada data serah-terima/setoran.',
  CURRENT_SETTLEMENT_EVIDENCE_MISSING: 'Belum ada data serah-terima/setoran aktif.',
  SETTLEMENT_VALIDATION_REQUIRED: 'Setoran belum divalidasi.',
  CURRENT_SETTLEMENT_VALIDATION_MISSING: 'Setoran belum divalidasi.',
  SETTLEMENT_VALIDATION_STALE: 'Setoran berubah dan harus divalidasi ulang.',
  SETTLEMENT_AMOUNT_MISMATCH: 'Ada selisih nominal yang perlu diklarifikasi.',
  SETTLEMENT_VALIDATION_REQUIRES_NEW_EVIDENCE: 'Koreksi evidence settlement diperlukan sebelum validasi ulang.',
  SETTLEMENT_VALIDATION_ALREADY_MATCHED: 'Settlement aktif sudah divalidasi dan nominalnya sesuai.',
  FINANCIAL_NOT_READY: 'Rekonsiliasi keuangan belum siap.',
  PACKAGE_FINANCIAL_SOURCE_NOT_CLEAN: 'Data sumber berubah dan perlu direkonsiliasi.',
  SOURCE_RECONCILIATION_REQUIRED: 'Data sumber berubah dan perlu direkonsiliasi.',
  UNRESOLVED_CORRECTION: 'Masih ada koreksi yang belum selesai.',
  PC_ASSIGNMENT_REQUIRED: 'Akun tidak memiliki assignment PC yang sesuai.',
  PC_VALIDATOR_ASSIGNMENT_REQUIRED: 'Akun tidak memiliki assignment PC validator yang sesuai.',
  PACKAGE_NOT_WAITING_PC_APPROVAL: 'Package tidak berada pada antrean proses PC.',
  HISTORICAL_SETTLEMENT_EVIDENCE_UNAVAILABLE: 'Evidence settlement historis hanya dapat dibaca.',
  HISTORICAL_VALIDATION_UNAVAILABLE: 'Validasi historis hanya dapat dibaca.',
  SETTLEMENT_ROLE_NOT_ALLOWED: 'Role saat ini tidak dapat mencatat settlement.',
};

export function packageHasAction(
  source: Pick<GorutPackageSummary, 'workflow'> | Pick<GorutPackageDetail, 'workflow'>,
  action: GorutPackageAction,
) {
  return source.workflow.availableActions.includes(action);
}

export function packageStateLabel(state: GorutPackageState | null) {
  return state ? packageStateLabels[state] : 'State belum tersedia';
}

export function packageBlockingReasonLabel(reason: string) {
  return blockingReasonLabels[reason] ?? reason.toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

export function formatCanonicalRupiah(value: string | null) {
  if (value === null) return 'Belum siap';
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return value;
  const integer = match[1]!.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const cents = (match[2] ?? '').padEnd(2, '0');
  return `Rp${integer}${cents !== '00' ? `,${cents}` : ''}`;
}

export function formatSignedCanonicalRupiah(value: string | null) {
  if (value === null) return 'Belum tersedia';
  const explicitSign = value.startsWith('-') ? '-' : value.startsWith('+') ? '+' : '';
  const absolute = explicitSign ? value.slice(1) : value;
  const formatted = formatCanonicalRupiah(absolute);
  if (formatted === absolute) return value;
  const sign = explicitSign || /^0(?:\.0{1,2})?$/.test(absolute) ? explicitSign : '+';
  return `${sign}${formatted}`;
}

export function formatPackageTimestamp(value: string | null) {
  if (!value) return 'Belum tersedia';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

export function packageFinancialLabel(source: GorutPackageSummary | GorutPackageDetail, key: 'recordedAmount' | 'grossAmount' | 'totalPlpkFee' | 'netAmount') {
  return source.financial.status === 'READY' || key === 'recordedAmount'
    ? formatCanonicalRupiah(source.financial[key])
    : 'Belum siap';
}

export function packageStatusTone(state: GorutPackageState | null, financialStatus?: string) {
  if (financialStatus === 'BLOCKED' || state === 'RETURNED_TO_RANTING' || state === 'RETURNED_TO_UPZIS') return 'is-returned';
  if (state === 'WAITING_PC_APPROVAL' || state === 'FINAL_APPROVED') return 'is-forwarded';
  if (state === 'WAITING_UPZIS_VERIFICATION') return 'is-waiting';
  return 'is-draft';
}

export function isProvisionalFeePolicy(version: string | null | undefined) {
  return version === 'GORUT-PLPK-FEE-V1-PROVISIONAL';
}

export function validatePackageReturnForm(reasonCode: GorutPackageReturnReasonCode, reason: string, targetCount: number) {
  if (targetCount < 1) return 'Pilih minimal satu target koreksi yang factual.';
  if (reasonCode === 'OTHER' && !reason.trim()) return 'Alasan bebas wajib diisi untuk kode OTHER.';
  return null;
}
