import { createHash } from "node:crypto"
import { GorutTransactionState, Prisma } from "@prisma/client"

export const NORMALIZED_TRANSACTION_SOURCE_TYPE = "GORUT_TRANSACTION"

export const packageMaterializationErrorCodes = [
  "INVALID_PERIOD",
  "INVALID_KECAMATAN_CODE",
  "UNRESOLVED_REGION",
  "UNRESOLVED_PLPK",
  "PERIOD_MISMATCH",
  "AMOUNT_INVALID",
  "TRANSACTION_RECONCILIATION_FAILED",
  "BUSINESS_WORKFLOW_ELIGIBILITY_UNCONFIRMED",
  "TRANSACTION_STATE_INELIGIBLE",
  "PACKAGE_SOURCE_CONFLICT",
  "PACKAGE_MEMBERSHIP_CONFLICT",
  "FINANCIAL_SOURCE_INCOMPLETE",
  "PACKAGE_LOCKED",
  "VERSION_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
] as const

export type PackageMaterializationErrorCode = (typeof packageMaterializationErrorCodes)[number]

export class GorutPackageMaterializationError extends Error {
  readonly code: PackageMaterializationErrorCode
  readonly metadata?: Record<string, string | number | boolean | null>

  constructor(
    code: PackageMaterializationErrorCode,
    message: string,
    metadata?: Record<string, string | number | boolean | null>,
  ) {
    super(message)
    this.name = "GorutPackageMaterializationError"
    this.code = code
    this.metadata = metadata
  }
}

export type CanonicalPackagePeriod = {
  key: string
  start: Date
  end: Date
}

/** GORUT package dates use the repository's existing UTC month convention. */
export function normalizePackagePeriod(value: string | Date): CanonicalPackagePeriod {
  let year: number
  let monthIndex: number

  if (typeof value === "string") {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      throw new GorutPackageMaterializationError("INVALID_PERIOD", "Period must use canonical YYYY-MM format.")
    }
    ;[year, monthIndex] = [Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1]
  } else {
    if (Number.isNaN(value.getTime())) {
      throw new GorutPackageMaterializationError("INVALID_PERIOD", "Period date is invalid.")
    }
    year = value.getUTCFullYear()
    monthIndex = value.getUTCMonth()
  }

  const start = new Date(Date.UTC(year, monthIndex, 1))
  const end = new Date(Date.UTC(year, monthIndex + 1, 1))
  return { key: start.toISOString().slice(0, 7), start, end }
}

export function buildGorutPackageCode(kecamatanCode: string, period: CanonicalPackagePeriod) {
  const canonicalCode = kecamatanCode.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(canonicalCode)) {
    throw new GorutPackageMaterializationError(
      "INVALID_KECAMATAN_CODE",
      "Canonical Kecamatan code is not safe for a public package code.",
    )
  }
  return `GORUT-${canonicalCode}-${period.key.replace("-", "")}`
}

type DecimalValue = { toString(): string }

export type MaterializationTransactionSource = {
  id: string
  code: string
  kecamatanId: string
  rantingId: string
  plpkId: string
  transactionDate: Date
  totalAmount: DecimalValue
  currentState: GorutTransactionState
  updatedAt: Date
  kecamatan: { id: string; code: string }
  ranting: { id: string; kecamatanId: string; code: string }
  plpk: { id: string; rantingId: string; code: string }
  items: Array<{
    munfiqId: string
    amount: DecimalValue
    periodLabel: string | null
    munfiq: { id: string; code: string; rantingId: string; plpkId: string }
  }>
  collectionSource?: null | {
    collectionCode: string
    status: string
    recordOrigin: string
    amountAuthorityStatus: string
    feeAuthorityStatus: string
    financialStatus: string
    financialBlockingReasons: string[]
    grossAmount: DecimalValue | null
    totalPlpkFee: DecimalValue | null
    netAmount: DecimalValue | null
    calculationPolicyVersion: string | null
    financialSourceHash: string | null
    revision: number
    sourceHash: string
    transactionSourceHash: string | null
    confirmedByPlpkAt: Date | null
    submittedToKordesAt: Date | null
    verifiedByKordesAt: Date | null
    returnedForCorrectionAt: Date | null
  }
}

function canonicalDecimal(value: DecimalValue) {
  return new Prisma.Decimal(value.toString()).toFixed(2)
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right))
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`
}

export function stableSourceHash(value: unknown) {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`
}

/** Hash only canonical operational facts; labels, names, UI formatting, and timestamps are excluded. */
export function transactionSourceHash(source: MaterializationTransactionSource) {
  return stableSourceHash({
    code: source.code,
    currentState: source.currentState,
    kecamatanCode: source.kecamatan.code,
    plpkCode: source.plpk.code,
    rantingCode: source.ranting.code,
    totalAmount: canonicalDecimal(source.totalAmount),
    transactionDate: source.transactionDate.toISOString(),
    collectionSource: source.collectionSource ? {
      collectionCode: source.collectionSource.collectionCode,
      revision: source.collectionSource.revision,
      sourceHash: source.collectionSource.sourceHash,
      transactionSourceHash: source.collectionSource.transactionSourceHash,
    } : null,
    items: [...source.items]
      .sort((left, right) => left.munfiq.code.localeCompare(right.munfiq.code))
      .map((item) => ({
        amount: canonicalDecimal(item.amount),
        munfiqCode: item.munfiq.code,
        periodLabel: item.periodLabel,
      })),
  })
}

export type TransactionEligibility = {
  eligible: boolean
  blockingReasons: PackageMaterializationErrorCode[]
}

export function evaluateTransactionEligibility(
  source: MaterializationTransactionSource,
  expectedKecamatanId: string,
  period: CanonicalPackagePeriod,
  eligibleStates: ReadonlySet<GorutTransactionState>,
): TransactionEligibility {
  const reasons = new Set<PackageMaterializationErrorCode>()

  if (
    source.kecamatanId !== expectedKecamatanId ||
    source.kecamatan.id !== expectedKecamatanId ||
    source.ranting.kecamatanId !== expectedKecamatanId
  ) reasons.add("UNRESOLVED_REGION")

  if (
    source.rantingId !== source.ranting.id ||
    source.plpkId !== source.plpk.id ||
    source.plpk.rantingId !== source.rantingId ||
    source.items.some((item) =>
      item.munfiqId !== item.munfiq.id ||
      item.munfiq.rantingId !== source.rantingId ||
      item.munfiq.plpkId !== source.plpkId
    )
  ) reasons.add("UNRESOLVED_PLPK")

  if (source.transactionDate < period.start || source.transactionDate >= period.end) reasons.add("PERIOD_MISMATCH")

  let recorded: Prisma.Decimal
  try {
    recorded = new Prisma.Decimal(source.totalAmount.toString())
    if (recorded.isNegative() || source.items.some((item) => new Prisma.Decimal(item.amount.toString()).isNegative())) {
      reasons.add("AMOUNT_INVALID")
    }
  } catch {
    reasons.add("AMOUNT_INVALID")
    recorded = new Prisma.Decimal(0)
  }

  if (!reasons.has("AMOUNT_INVALID")) {
    const itemTotal = source.items.reduce((sum, item) => sum.plus(item.amount.toString()), new Prisma.Decimal(0))
    if (!itemTotal.equals(recorded)) reasons.add("TRANSACTION_RECONCILIATION_FAILED")
  }

  if (eligibleStates.size === 0) reasons.add("BUSINESS_WORKFLOW_ELIGIBILITY_UNCONFIRMED")
  else if (!eligibleStates.has(source.currentState)) reasons.add("TRANSACTION_STATE_INELIGIBLE")

  return { eligible: reasons.size === 0, blockingReasons: [...reasons] }
}

export function calculateFinancialSnapshot(grossAmount: DecimalValue, totalPlpkFee: DecimalValue) {
  const gross = new Prisma.Decimal(grossAmount.toString())
  const fee = new Prisma.Decimal(totalPlpkFee.toString())
  if (gross.isNegative() || fee.isNegative() || fee.greaterThan(gross)) {
    throw new GorutPackageMaterializationError("AMOUNT_INVALID", "Authoritative financial amounts are inconsistent.")
  }
  return { grossAmount: gross, totalPlpkFee: fee, netAmount: gross.minus(fee) }
}
