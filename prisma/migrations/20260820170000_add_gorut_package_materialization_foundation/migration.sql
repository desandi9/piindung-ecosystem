-- Phase 2A must represent unavailable financial authority without writing a fake zero snapshot.
CREATE TYPE "GorutPackageFinancialStatus" AS ENUM ('UNVERIFIED', 'BLOCKED', 'READY');

ALTER TABLE "GorutUpzisPackage"
  ADD COLUMN "financialStatus" "GorutPackageFinancialStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "financialBlockingReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "financialSourceHash" TEXT;

ALTER TABLE "GorutUpzisPackage" DROP CONSTRAINT "GorutUpzisPackage_financial_check";

ALTER TABLE "GorutUpzisPackage"
  ALTER COLUMN "grossAmount" DROP DEFAULT,
  ALTER COLUMN "grossAmount" DROP NOT NULL,
  ALTER COLUMN "totalPlpkFee" DROP DEFAULT,
  ALTER COLUMN "totalPlpkFee" DROP NOT NULL,
  ALTER COLUMN "netAmount" DROP DEFAULT,
  ALTER COLUMN "netAmount" DROP NOT NULL;

ALTER TABLE "GorutUpzisPackage" ADD CONSTRAINT "GorutUpzisPackage_financial_check" CHECK (
  (
    "grossAmount" IS NULL AND
    "totalPlpkFee" IS NULL AND
    "netAmount" IS NULL
  ) OR (
    "grossAmount" IS NOT NULL AND
    "totalPlpkFee" IS NOT NULL AND
    "netAmount" IS NOT NULL AND
    "grossAmount" >= 0 AND
    "totalPlpkFee" >= 0 AND
    "netAmount" >= 0 AND
    "netAmount" = "grossAmount" - "totalPlpkFee"
  )
);

ALTER TABLE "GorutUpzisPackage" ADD CONSTRAINT "GorutUpzisPackage_financial_status_check" CHECK (
  (
    "financialStatus" = 'UNVERIFIED'
  ) OR (
    "financialStatus" = 'BLOCKED' AND
    "grossAmount" IS NULL AND
    "totalPlpkFee" IS NULL AND
    "netAmount" IS NULL AND
    "calculatedAt" IS NULL AND
    "calculationPolicyVersion" IS NULL AND
    "financialSourceRevision" IS NULL AND
    "financialSourceHash" IS NULL AND
    cardinality("financialBlockingReasons") > 0
  ) OR (
    "financialStatus" = 'READY' AND
    "grossAmount" IS NOT NULL AND
    "totalPlpkFee" IS NOT NULL AND
    "netAmount" IS NOT NULL AND
    "calculatedAt" IS NOT NULL AND
    length(btrim("calculationPolicyVersion")) > 0 AND
    "financialSourceRevision" IS NOT NULL AND
    "financialSourceRevision" >= 1 AND
    length(btrim("financialSourceHash")) > 0 AND
    cardinality("financialBlockingReasons") = 0
  )
);

CREATE INDEX "GorutUpzisPackage_financialStatus_idx" ON "GorutUpzisPackage"("financialStatus");
