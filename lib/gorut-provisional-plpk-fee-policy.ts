import { GorutCollectionVisitStatus, Prisma } from "@prisma/client"

export const GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION = "GORUT-PLPK-FEE-V1-PROVISIONAL"
export const GORUT_PROVISIONAL_PLPK_FEE_POLICY_AUTHORITY = "PROVISIONAL_PENDING_SOP_CONFIRMATION"
export const GORUT_PROVISIONAL_PLPK_FEE_POLICY_BASIS = "PER_MUNFIQ_PER_PERIOD"
export const GORUT_PROVISIONAL_PLPK_FEE_THRESHOLD = new Prisma.Decimal("7000.00")
export const GORUT_PROVISIONAL_PLPK_FEE_AMOUNT = new Prisma.Decimal("2500.00")

export type GorutDeploymentEnvironment = "DEVELOPMENT" | "TEST" | "STAGING" | "UAT" | "PRODUCTION" | "UNKNOWN"
export type GorutProvisionalFeeRuntime = {
  deploymentEnvironment: GorutDeploymentEnvironment
  enabled: boolean
}

export class GorutProvisionalFeePolicyDisabledError extends Error {
  readonly code = "PROVISIONAL_FEE_POLICY_DISABLED"

  constructor(message: string) {
    super(message)
    this.name = "GorutProvisionalFeePolicyDisabledError"
  }
}

export function resolveGorutProvisionalFeeRuntime(
  environment: Record<string, string | undefined> = process.env,
): GorutProvisionalFeeRuntime {
  const explicit = environment.GORUT_DEPLOYMENT_ENV?.trim().toUpperCase()
  const platformProduction = environment.VERCEL_ENV?.trim().toLowerCase() === "production"
  const deploymentEnvironment: GorutDeploymentEnvironment =
    platformProduction
      ? "PRODUCTION"
      : explicit === "DEVELOPMENT" || explicit === "TEST" || explicit === "STAGING" || explicit === "UAT" || explicit === "PRODUCTION"
      ? explicit
      : environment.NODE_ENV === "development"
        ? "DEVELOPMENT"
        : environment.NODE_ENV === "test"
          ? "TEST"
          : environment.NODE_ENV === "production"
            ? "PRODUCTION"
            : "UNKNOWN"

  return {
    deploymentEnvironment,
    enabled: environment.GORUT_ENABLE_PROVISIONAL_FEE_POLICY === "true",
  }
}

export function isGorutProvisionalFeePolicyAllowed(runtime: GorutProvisionalFeeRuntime) {
  return runtime.enabled && (
    runtime.deploymentEnvironment === "STAGING" ||
    runtime.deploymentEnvironment === "UAT"
  )
}

export function assertGorutProvisionalFeePolicyAllowed(
  runtime: GorutProvisionalFeeRuntime,
  hostRuntime = resolveGorutProvisionalFeeRuntime(),
) {
  // A test-only injected runtime must never be able to disguise an actual
  // production host as staging/UAT.
  const productionHost = hostRuntime.deploymentEnvironment === "PRODUCTION"
  if (productionHost || !isGorutProvisionalFeePolicyAllowed(runtime)) {
    throw new GorutProvisionalFeePolicyDisabledError(
      productionHost || runtime.deploymentEnvironment === "PRODUCTION"
        ? "The provisional PLPK fee policy is permanently disabled for production."
        : "The provisional PLPK fee policy requires GORUT_DEPLOYMENT_ENV=STAGING or UAT and the explicit enable flag.",
    )
  }
}

export function calculateProvisionalPlpkFee(amountValue: Prisma.Decimal | string, visitStatus: GorutCollectionVisitStatus) {
  const amount = new Prisma.Decimal(amountValue.toString())
  if (amount.isNegative()) throw new RangeError("Collection amount must be non-negative.")
  const eligible = visitStatus === GorutCollectionVisitStatus.COLLECTED && amount.greaterThan(GORUT_PROVISIONAL_PLPK_FEE_THRESHOLD)
  return {
    eligible,
    feeAmount: eligible ? new Prisma.Decimal(GORUT_PROVISIONAL_PLPK_FEE_AMOUNT) : new Prisma.Decimal(0),
  }
}

export type GorutProvisionalFeeAggregateEntry = {
  munfiqKey: string
  visitStatus: GorutCollectionVisitStatus
  amount: Prisma.Decimal | string
}

/**
 * Defensive aggregate calculator for PER_MUNFIQ_PER_PERIOD. The current database
 * grain already permits one entry per Munfiq in one canonical PLPK-month batch,
 * but grouping here prevents a future multi-entry source from multiplying fees.
 */
export function calculateProvisionalPlpkFeeByMunfiqPeriod(entries: readonly GorutProvisionalFeeAggregateEntry[]) {
  const grouped = new Map<string, Prisma.Decimal>()
  let grossAmount = new Prisma.Decimal(0)

  for (const entry of entries) {
    const amount = new Prisma.Decimal(entry.amount.toString())
    if (amount.isNegative()) throw new RangeError("Collection amount must be non-negative.")
    if (entry.visitStatus !== GorutCollectionVisitStatus.COLLECTED) continue
    grossAmount = grossAmount.plus(amount)
    grouped.set(entry.munfiqKey, (grouped.get(entry.munfiqKey) ?? new Prisma.Decimal(0)).plus(amount))
  }

  const snapshots = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([munfiqKey, amount]) => {
      const fee = calculateProvisionalPlpkFee(amount, GorutCollectionVisitStatus.COLLECTED)
      return {
        munfiqKey,
        authoritativeCollectedAmount: amount,
        eligibleForPlpkFee: fee.eligible,
        plpkFee: fee.feeAmount,
        feePolicyVersion: GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION,
      }
    })
  const totalPlpkFee = snapshots.reduce((sum, snapshot) => sum.plus(snapshot.plpkFee), new Prisma.Decimal(0))

  return {
    grossAmount,
    totalPlpkFee,
    netAmount: grossAmount.minus(totalPlpkFee),
    snapshots,
  }
}

export function createGorutProvisionalPlpkFeePolicy(runtime = resolveGorutProvisionalFeeRuntime()) {
  assertGorutProvisionalFeePolicyAllowed(runtime)
  return Object.freeze({
    authority: GORUT_PROVISIONAL_PLPK_FEE_POLICY_AUTHORITY,
    basis: GORUT_PROVISIONAL_PLPK_FEE_POLICY_BASIS,
    version: GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION,
    calculate(input: { amount: Prisma.Decimal; visitStatus: GorutCollectionVisitStatus }) {
      const result = calculateProvisionalPlpkFee(input.amount, input.visitStatus)
      return { eligible: result.eligible, feeAmount: result.feeAmount }
    },
  })
}

export function getConfiguredGorutProvisionalPlpkFeePolicy(runtime = resolveGorutProvisionalFeeRuntime()) {
  return isGorutProvisionalFeePolicyAllowed(runtime) ? createGorutProvisionalPlpkFeePolicy(runtime) : null
}
