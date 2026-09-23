import { Prisma } from "@prisma/client"
import type { GorutPackageFinancialAuthority } from "./gorut-package-materializer"
// @ts-expect-error Node's native strip-types tests require the explicit TypeScript extension.
import { GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION } from "./gorut-provisional-plpk-fee-policy.ts"

export const AUTHORITATIVE_COLLECTION_PACKAGE_POLICY_VERSION = "GORUT_AUTHORITATIVE_COLLECTION_V1"

/**
 * Package financial adapter for transactions produced by the authoritative
 * collection bridge. It never falls back to GorutTransaction.totalAmount.
 */
export function createAuthoritativeCollectionFinancialAuthority(): GorutPackageFinancialAuthority {
  return {
    calculationPolicyVersion: AUTHORITATIVE_COLLECTION_PACKAGE_POLICY_VERSION,
    calculate(transactions) {
      const blockers = new Set<string>()
      let grossAmount = new Prisma.Decimal(0)
      let totalPlpkFee = new Prisma.Decimal(0)

      for (const transaction of transactions) {
        const source = transaction.collectionSource
        if (!source) {
          blockers.add("AUTHORITATIVE_COLLECTION_SOURCE_MISSING")
          continue
        }
        if (source.amountAuthorityStatus !== "AUTHORITATIVE") blockers.add("COLLECTION_AMOUNT_NOT_AUTHORITATIVE")
        if (source.feeAuthorityStatus !== "AUTHORITATIVE") blockers.add("COLLECTION_FEE_POLICY_UNAVAILABLE")
        if (source.calculationPolicyVersion !== GORUT_PROVISIONAL_PLPK_FEE_POLICY_VERSION) {
          blockers.add("COLLECTION_FEE_POLICY_VERSION_INVALID")
        }
        if (source.financialStatus !== "READY" || !source.grossAmount || !source.totalPlpkFee || !source.netAmount) {
          for (const reason of source.financialBlockingReasons) blockers.add(reason)
          blockers.add("COLLECTION_FINANCIAL_SOURCE_INCOMPLETE")
          continue
        }
        if (!source.financialSourceHash || source.transactionSourceHash !== source.sourceHash) {
          blockers.add("COLLECTION_SOURCE_CHANGED_AFTER_TRANSACTION_BRIDGE")
          continue
        }
        const sourceGross = new Prisma.Decimal(source.grossAmount.toString())
        const sourceFee = new Prisma.Decimal(source.totalPlpkFee.toString())
        const sourceNet = new Prisma.Decimal(source.netAmount.toString())
        if (!sourceGross.minus(sourceFee).equals(sourceNet)) {
          blockers.add("COLLECTION_FINANCIAL_FORMULA_MISMATCH")
          continue
        }
        grossAmount = grossAmount.plus(sourceGross)
        totalPlpkFee = totalPlpkFee.plus(sourceFee)
      }

      if (blockers.size) return { ready: false, blockingReasons: [...blockers].sort() }
      return { ready: true, grossAmount, totalPlpkFee }
    },
  }
}
