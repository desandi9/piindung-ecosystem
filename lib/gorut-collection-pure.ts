import {
  GorutCollectionAuthorityStatus,
  GorutCollectionFinancialStatus,
  GorutCollectionStatus,
  GorutCollectionVisitStatus,
  Prisma,
} from "@prisma/client"
import type { GorutOperationalContext } from "./gorut/server-pure"
// @ts-expect-error Node's native strip-types tests require the explicit TypeScript extension.
import { calculateProvisionalPlpkFee, GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION } from "./gorut-provisional-plpk-fee-policy.ts"
// @ts-expect-error Node's native strip-types tests require the explicit TypeScript extension.
import { normalizePackagePeriod, stableSourceHash, type CanonicalPackagePeriod } from "./gorut-package-materializer-pure.ts"

export const collectionErrorCodes = [
  "COLLECTION_ACCESS_DENIED",
  "COLLECTION_NOT_FOUND",
  "COLLECTION_GRAIN_CONFLICT",
  "COLLECTION_HIERARCHY_MISMATCH",
  "COLLECTION_PERIOD_MISMATCH",
  "COLLECTION_AMOUNT_INVALID",
  "COLLECTION_NOTE_REQUIRED",
  "COLLECTION_STATE_INVALID",
  "COLLECTION_VERSION_CONFLICT",
  "COLLECTION_IDEMPOTENCY_CONFLICT",
  "COLLECTION_CORRECTION_REQUIRED",
  "COLLECTION_SOURCE_CONFLICT",
  "COLLECTION_FINANCIAL_INCOMPLETE",
  "COLLECTION_BRIDGE_POLICY_UNCONFIRMED",
] as const

export type GorutCollectionErrorCode = (typeof collectionErrorCodes)[number]

export class GorutCollectionError extends Error {
  readonly code: GorutCollectionErrorCode
  readonly metadata?: Record<string, string | number | boolean | null>

  constructor(code: GorutCollectionErrorCode, message: string, metadata?: Record<string, string | number | boolean | null>) {
    super(message)
    this.name = "GorutCollectionError"
    this.code = code
    this.metadata = metadata
  }
}

function canonicalIdentityCode(value: string, label: string) {
  const code = value.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(code)) {
    throw new GorutCollectionError("COLLECTION_GRAIN_CONFLICT", `${label} code is not safe for a deterministic public code.`)
  }
  return code
}

export function normalizeCollectionPeriod(value: string | Date): CanonicalPackagePeriod {
  return normalizePackagePeriod(value)
}

export function buildCollectionCode(plpkCode: string, period: CanonicalPackagePeriod) {
  return `GORUT-COL-${canonicalIdentityCode(plpkCode, "PLPK")}-${period.key.replace("-", "")}`
}

export function buildCollectionTransactionCode(collectionCode: string) {
  return `TRX-${canonicalIdentityCode(collectionCode, "Collection")}`
}

export function canWriteCollectionAsPlpk(context: GorutOperationalContext, plpkId: string) {
  return context.operationalRole === "PLPK" && context.plpkId === plpkId
}

export function canVerifyCollectionAsKordes(context: GorutOperationalContext, rantingId: string) {
  return context.operationalRole === "RANTING" && context.rantingId === rantingId
}

type DecimalValue = { toString(): string }

export type CollectionFinancialEntry = {
  visitStatus: GorutCollectionVisitStatus
  amount: DecimalValue
  feeEligibleSnapshot: boolean | null
  plpkFeeSnapshot: DecimalValue | null
  feePolicyVersion: string | null
}

export type CollectionFinancialFacts = {
  amountAuthorityStatus: GorutCollectionAuthorityStatus
  feeAuthorityStatus: GorutCollectionAuthorityStatus
  financialStatus: GorutCollectionFinancialStatus
  financialBlockingReasons: string[]
  grossAmount: Prisma.Decimal | null
  totalPlpkFee: Prisma.Decimal | null
  netAmount: Prisma.Decimal | null
  calculationPolicyVersion: string | null
  financialSourceHash: string | null
}

export function calculateCollectionFinancialFacts(
  entries: readonly CollectionFinancialEntry[],
  amountAuthorityStatus: GorutCollectionAuthorityStatus,
): CollectionFinancialFacts {
  const blockers = new Set<string>()
  if (amountAuthorityStatus !== GorutCollectionAuthorityStatus.AUTHORITATIVE) blockers.add("COLLECTION_AMOUNT_NOT_AUTHORITATIVE")
  if (entries.length === 0) blockers.add("COLLECTION_ENTRIES_EMPTY")

  let gross = new Prisma.Decimal(0)
  for (const entry of entries) {
    const amount = new Prisma.Decimal(entry.amount.toString())
    if (amount.isNegative() || (entry.visitStatus !== GorutCollectionVisitStatus.COLLECTED && !amount.isZero())) {
      throw new GorutCollectionError("COLLECTION_AMOUNT_INVALID", "Collection entry amount is inconsistent with its visit status.")
    }
    if (entry.visitStatus === GorutCollectionVisitStatus.COLLECTED) gross = gross.plus(amount)
  }

  const policyVersions = new Set(entries.map((entry) => entry.feePolicyVersion).filter((value): value is string => Boolean(value)))
  const completeFeeSnapshots = entries.length > 0 && entries.every((entry) =>
    entry.feeEligibleSnapshot !== null && entry.plpkFeeSnapshot !== null && Boolean(entry.feePolicyVersion?.trim())
  )
  if (!completeFeeSnapshots) blockers.add("COLLECTION_FEE_POLICY_UNAVAILABLE")
  if (policyVersions.size > 1) blockers.add("COLLECTION_FEE_POLICY_INCONSISTENT")

  let totalFee = new Prisma.Decimal(0)
  let snapshotsMatchPolicy = false
  if (completeFeeSnapshots && policyVersions.size === 1) {
    const policyVersion = [...policyVersions][0]!
    snapshotsMatchPolicy = policyVersion === GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION
    if (!snapshotsMatchPolicy) blockers.add("COLLECTION_FEE_POLICY_VERSION_UNSUPPORTED")
    for (const entry of entries) {
      const fee = new Prisma.Decimal(entry.plpkFeeSnapshot!.toString())
      if (fee.isNegative() || (!entry.feeEligibleSnapshot && !fee.isZero())) {
        throw new GorutCollectionError("COLLECTION_AMOUNT_INVALID", "PLPK fee snapshot is inconsistent.")
      }
      if (policyVersion === GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION) {
        const expected = calculateProvisionalPlpkFee(entry.amount.toString(), entry.visitStatus)
        if (entry.feeEligibleSnapshot !== expected.eligible || !fee.equals(expected.feeAmount)) {
          snapshotsMatchPolicy = false
          blockers.add("COLLECTION_FEE_SNAPSHOT_MISMATCH")
        }
      }
      totalFee = totalFee.plus(fee)
    }
  }

  const feeAuthorityStatus = completeFeeSnapshots && policyVersions.size === 1 && snapshotsMatchPolicy
    ? GorutCollectionAuthorityStatus.AUTHORITATIVE
    : GorutCollectionAuthorityStatus.UNVERIFIED
  if (totalFee.greaterThan(gross)) blockers.add("COLLECTION_NET_AMOUNT_NEGATIVE")

  if (blockers.size) {
    return {
      amountAuthorityStatus,
      feeAuthorityStatus,
      financialStatus: GorutCollectionFinancialStatus.BLOCKED,
      financialBlockingReasons: [...blockers],
      grossAmount: amountAuthorityStatus === GorutCollectionAuthorityStatus.AUTHORITATIVE && entries.length > 0 ? gross : null,
      totalPlpkFee: null,
      netAmount: null,
      calculationPolicyVersion: null,
      financialSourceHash: null,
    }
  }

  const calculationPolicyVersion = [...policyVersions][0]!
  const net = gross.minus(totalFee)
  return {
    amountAuthorityStatus,
    feeAuthorityStatus,
    financialStatus: GorutCollectionFinancialStatus.READY,
    financialBlockingReasons: [],
    grossAmount: gross,
    totalPlpkFee: totalFee,
    netAmount: net,
    calculationPolicyVersion,
    financialSourceHash: stableSourceHash({
      calculationPolicyVersion,
      entries: entries.map((entry) => ({
        amount: new Prisma.Decimal(entry.amount.toString()).toFixed(2),
        eligible: entry.feeEligibleSnapshot,
        fee: new Prisma.Decimal(entry.plpkFeeSnapshot!.toString()).toFixed(2),
        feePolicyVersion: entry.feePolicyVersion,
        visitStatus: entry.visitStatus,
      })),
      grossAmount: gross.toFixed(2),
      netAmount: net.toFixed(2),
      totalPlpkFee: totalFee.toFixed(2),
    }),
  }
}

export type CollectionSourceHashInput = {
  collectionCode: string
  periodStart: Date
  kecamatanCode: string
  rantingCode: string
  plpkCode: string
  status: GorutCollectionStatus
  entries: Array<{
    munfiqCode: string
    visitStatus: GorutCollectionVisitStatus
    amount: DecimalValue
    collectedAt: Date | null
    note: string | null
    feeEligibleSnapshot: boolean | null
    plpkFeeSnapshot: DecimalValue | null
    feePolicyVersion: string | null
  }>
}

/** Canonical source hash excludes labels, database IDs, revision numbers, and write timestamps. */
export function collectionSourceHash(input: CollectionSourceHashInput) {
  return stableSourceHash({
    collectionCode: input.collectionCode,
    entries: [...input.entries]
      .sort((left, right) => left.munfiqCode.localeCompare(right.munfiqCode))
      .map((entry) => ({
        amount: new Prisma.Decimal(entry.amount.toString()).toFixed(2),
        collectedAt: entry.collectedAt?.toISOString() ?? null,
        feeEligibleSnapshot: entry.feeEligibleSnapshot,
        feePolicyVersion: entry.feePolicyVersion,
        munfiqCode: entry.munfiqCode,
        note: entry.note,
        plpkFeeSnapshot: entry.plpkFeeSnapshot ? new Prisma.Decimal(entry.plpkFeeSnapshot.toString()).toFixed(2) : null,
        visitStatus: entry.visitStatus,
      })),
    kecamatanCode: input.kecamatanCode,
    periodStart: input.periodStart.toISOString().slice(0, 10),
    plpkCode: input.plpkCode,
    rantingCode: input.rantingCode,
    status: input.status,
  })
}

export function collectionEntrySourceHash(input: {
  collectionCode: string
  munfiqCode: string
  visitStatus: GorutCollectionVisitStatus
  amount: DecimalValue
  collectedAt: Date | null
  note: string | null
  feeEligibleSnapshot: boolean | null
  plpkFeeSnapshot: DecimalValue | null
  feePolicyVersion: string | null
}) {
  return stableSourceHash({
    ...input,
    amount: new Prisma.Decimal(input.amount.toString()).toFixed(2),
    collectedAt: input.collectedAt?.toISOString() ?? null,
    plpkFeeSnapshot: input.plpkFeeSnapshot ? new Prisma.Decimal(input.plpkFeeSnapshot.toString()).toFixed(2) : null,
  })
}

export function buildInitialPendingCollectionEntries(
  collectionCode: string,
  munfiqs: ReadonlyArray<{ id: string; code: string }>,
) {
  return munfiqs
    .slice()
    .sort((left, right) => left.code.localeCompare(right.code))
    .map((munfiq) => {
      const facts = {
        collectionCode,
        munfiqCode: munfiq.code,
        visitStatus: GorutCollectionVisitStatus.PENDING,
        amount: new Prisma.Decimal(0),
        collectedAt: null,
        note: null,
        feeEligibleSnapshot: null,
        plpkFeeSnapshot: null,
        feePolicyVersion: null,
      }
      return {
        munfiqId: munfiq.id,
        munfiqCode: munfiq.code,
        visitStatus: facts.visitStatus,
        amount: "0.00",
        collectedAt: facts.collectedAt,
        note: facts.note,
        feeEligibleSnapshot: facts.feeEligibleSnapshot,
        plpkFeeSnapshot: facts.plpkFeeSnapshot,
        feePolicyVersion: facts.feePolicyVersion,
        sourceType: "SERVER_COLLECTION_COMMAND",
        sourceKey: `${collectionCode}:${munfiq.code}`,
        sourceHash: collectionEntrySourceHash(facts),
      }
    })
}
