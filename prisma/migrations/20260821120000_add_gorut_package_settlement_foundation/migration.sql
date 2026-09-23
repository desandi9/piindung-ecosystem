-- Phase 2D.1 factual handover / deposit evidence foundation.
-- Settlement evidence is package-owned and never represents a workflow transition.

CREATE TYPE "GorutPackageSettlementMode" AS ENUM ('PC_PICKUP', 'UPZIS_BANK_DEPOSIT');

CREATE TABLE "GorutPackageSettlementEvidence" (
  "id" TEXT NOT NULL,
  "evidenceCode" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "mode" "GorutPackageSettlementMode" NOT NULL,
  "revision" INTEGER NOT NULL,
  "supersedesEvidenceId" TEXT,
  "expectedAmountSnapshot" DECIMAL(19,2) NOT NULL,
  "actualAmount" DECIMAL(19,2) NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedByUserId" TEXT NOT NULL,
  "recordedByAssignmentId" TEXT NOT NULL,
  "handedOverByUserId" TEXT,
  "handedOverByAssignmentId" TEXT,
  "receivedByUserId" TEXT,
  "receivedAt" TIMESTAMP(3),
  "depositedByUserId" TEXT,
  "bankName" TEXT,
  "externalReference" TEXT,
  "evidenceReference" TEXT,
  "note" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "commandHash" TEXT NOT NULL,
  "packageVersionBefore" INTEGER NOT NULL,
  "packageVersionAfter" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GorutPackageSettlementEvidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GorutSettlement_amount_check" CHECK (
    "expectedAmountSnapshot" >= 0 AND "actualAmount" >= 0
  ),
  CONSTRAINT "GorutSettlement_revision_check" CHECK (
    "revision" >= 1 AND
    "packageVersionBefore" >= 1 AND
    "packageVersionAfter" = "packageVersionBefore" + 1
  ),
  CONSTRAINT "GorutSettlement_public_facts_check" CHECK (
    length(btrim("evidenceCode")) > 0 AND
    length(btrim("idempotencyKey")) > 0 AND
    length(btrim("commandHash")) > 0
  ),
  CONSTRAINT "GorutSettlement_supersession_check" CHECK (
    "supersedesEvidenceId" IS NULL OR "supersedesEvidenceId" <> "id"
  ),
  CONSTRAINT "GorutSettlement_mode_actor_check" CHECK (
    (
      "mode" = 'PC_PICKUP' AND
      "handedOverByUserId" IS NOT NULL AND
      "handedOverByAssignmentId" IS NOT NULL AND
      "receivedByUserId" IS NOT NULL AND
      "receivedAt" IS NOT NULL AND
      "depositedByUserId" IS NULL
    ) OR (
      "mode" = 'UPZIS_BANK_DEPOSIT' AND
      "handedOverByUserId" IS NULL AND
      "handedOverByAssignmentId" IS NULL AND
      "receivedByUserId" IS NULL AND
      "receivedAt" IS NULL AND
      "depositedByUserId" IS NOT NULL
    )
  )
);

CREATE UNIQUE INDEX "GorutPackageSettlementEvidence_evidenceCode_key"
  ON "GorutPackageSettlementEvidence"("evidenceCode");
CREATE UNIQUE INDEX "GorutPackageSettlementEvidence_supersedesEvidenceId_key"
  ON "GorutPackageSettlementEvidence"("supersedesEvidenceId");
CREATE UNIQUE INDEX "GorutSettlement_package_revision_key"
  ON "GorutPackageSettlementEvidence"("packageId", "revision");
CREATE UNIQUE INDEX "GorutSettlement_package_idempotency_key"
  ON "GorutPackageSettlementEvidence"("packageId", "idempotencyKey");
CREATE INDEX "GorutSettlement_package_recorded_idx"
  ON "GorutPackageSettlementEvidence"("packageId", "recordedAt");
CREATE INDEX "GorutPackageSettlementEvidence_recordedByUserId_idx"
  ON "GorutPackageSettlementEvidence"("recordedByUserId");
CREATE INDEX "GorutPackageSettlementEvidence_recordedByAssignmentId_idx"
  ON "GorutPackageSettlementEvidence"("recordedByAssignmentId");
CREATE INDEX "GorutPackageSettlementEvidence_handedOverByUserId_idx"
  ON "GorutPackageSettlementEvidence"("handedOverByUserId");
CREATE INDEX "GorutPackageSettlementEvidence_handedOverByAssignmentId_idx"
  ON "GorutPackageSettlementEvidence"("handedOverByAssignmentId");
CREATE INDEX "GorutPackageSettlementEvidence_receivedByUserId_idx"
  ON "GorutPackageSettlementEvidence"("receivedByUserId");
CREATE INDEX "GorutPackageSettlementEvidence_depositedByUserId_idx"
  ON "GorutPackageSettlementEvidence"("depositedByUserId");

ALTER TABLE "GorutPackageSettlementEvidence" ADD CONSTRAINT "GorutPackageSettlementEvidence_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "GorutUpzisPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementEvidence" ADD CONSTRAINT "GorutPackageSettlementEvidence_supersedesEvidenceId_fkey"
  FOREIGN KEY ("supersedesEvidenceId") REFERENCES "GorutPackageSettlementEvidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementEvidence" ADD CONSTRAINT "GorutPackageSettlementEvidence_recordedByUserId_fkey"
  FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementEvidence" ADD CONSTRAINT "GorutPackageSettlementEvidence_recordedByAssignmentId_fkey"
  FOREIGN KEY ("recordedByAssignmentId") REFERENCES "GorutOperationalAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementEvidence" ADD CONSTRAINT "GorutPackageSettlementEvidence_handedOverByUserId_fkey"
  FOREIGN KEY ("handedOverByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementEvidence" ADD CONSTRAINT "GorutPackageSettlementEvidence_handedOverByAssignmentId_fkey"
  FOREIGN KEY ("handedOverByAssignmentId") REFERENCES "GorutOperationalAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementEvidence" ADD CONSTRAINT "GorutPackageSettlementEvidence_receivedByUserId_fkey"
  FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageSettlementEvidence" ADD CONSTRAINT "GorutPackageSettlementEvidence_depositedByUserId_fkey"
  FOREIGN KEY ("depositedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
