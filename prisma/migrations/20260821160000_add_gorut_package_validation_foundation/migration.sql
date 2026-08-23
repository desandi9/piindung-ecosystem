-- Phase 2D.2 immutable validation evidence foundation.
-- Validation compares one settlement evidence revision and never changes workflow state.

CREATE TYPE "GorutPackageSettlementValidationResult" AS ENUM ('MATCHED', 'MISMATCH');

CREATE TABLE "GorutPackageSettlementValidation" (
  "id" TEXT NOT NULL,
  "validationCode" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "settlementEvidenceId" TEXT NOT NULL,
  "settlementRevisionSnapshot" INTEGER NOT NULL,
  "expectedAmountSnapshot" DECIMAL(19,2) NOT NULL,
  "actualAmountSnapshot" DECIMAL(19,2) NOT NULL,
  "differenceAmount" DECIMAL(19,2) NOT NULL,
  "result" "GorutPackageSettlementValidationResult" NOT NULL,
  "validatedAt" TIMESTAMP(3) NOT NULL,
  "validatorUserId" TEXT NOT NULL,
  "validatorAssignmentId" TEXT NOT NULL,
  "note" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "commandHash" TEXT NOT NULL,
  "packageVersionBefore" INTEGER NOT NULL,
  "packageVersionAfter" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GorutPackageSettlementValidation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GorutSettlementValidation_amount_check" CHECK (
    "expectedAmountSnapshot" >= 0 AND
    "actualAmountSnapshot" >= 0 AND
    "differenceAmount" = "actualAmountSnapshot" - "expectedAmountSnapshot"
  ),
  CONSTRAINT "GorutSettlementValidation_result_check" CHECK (
    ("result" = 'MATCHED' AND "differenceAmount" = 0) OR
    ("result" = 'MISMATCH' AND "differenceAmount" <> 0)
  ),
  CONSTRAINT "GorutSettlementValidation_revision_check" CHECK (
    "settlementRevisionSnapshot" >= 1 AND
    "packageVersionBefore" >= 1 AND
    "packageVersionAfter" = "packageVersionBefore" + 1
  ),
  CONSTRAINT "GorutSettlementValidation_public_facts_check" CHECK (
    length(btrim("validationCode")) > 0 AND
    length(btrim("idempotencyKey")) > 0 AND
    length(btrim("commandHash")) > 0
  )
);

CREATE UNIQUE INDEX "GorutPackageSettlementValidation_validationCode_key"
  ON "GorutPackageSettlementValidation"("validationCode");
CREATE UNIQUE INDEX "GorutPackageSettlementValidation_settlementEvidenceId_key"
  ON "GorutPackageSettlementValidation"("settlementEvidenceId");
CREATE UNIQUE INDEX "GorutSettlementValidation_package_idempotency_key"
  ON "GorutPackageSettlementValidation"("packageId", "idempotencyKey");
CREATE INDEX "GorutSettlementValidation_package_validated_idx"
  ON "GorutPackageSettlementValidation"("packageId", "validatedAt");
CREATE INDEX "GorutPackageSettlementValidation_validatorUserId_idx"
  ON "GorutPackageSettlementValidation"("validatorUserId");
CREATE INDEX "GorutPackageSettlementValidation_validatorAssignmentId_idx"
  ON "GorutPackageSettlementValidation"("validatorAssignmentId");

ALTER TABLE "GorutPackageSettlementValidation" ADD CONSTRAINT "GorutPackageSettlementValidation_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "GorutUpzisPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementValidation" ADD CONSTRAINT "GorutPackageSettlementValidation_settlementEvidenceId_fkey"
  FOREIGN KEY ("settlementEvidenceId") REFERENCES "GorutPackageSettlementEvidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementValidation" ADD CONSTRAINT "GorutPackageSettlementValidation_validatorUserId_fkey"
  FOREIGN KEY ("validatorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementValidation" ADD CONSTRAINT "GorutPackageSettlementValidation_validatorAssignmentId_fkey"
  FOREIGN KEY ("validatorAssignmentId") REFERENCES "GorutOperationalAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
