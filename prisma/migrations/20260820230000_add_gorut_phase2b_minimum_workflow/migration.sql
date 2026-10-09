-- Phase 2B minimum workflow foundation. No new workflow state or action is introduced.
CREATE TYPE "GorutReturnReasonCode" AS ENUM (
  'DATA_INCOMPLETE',
  'AMOUNT_MISMATCH',
  'UNRESOLVED_MAPPING',
  'COLLECTION_CORRECTION_REQUIRED',
  'FINANCIAL_RECONCILIATION_FAILED',
  'EVIDENCE_INCOMPLETE',
  'OTHER'
);

CREATE TYPE "GorutPackageCorrectionTargetType" AS ENUM ('PACKAGE', 'RANTING', 'TRANSACTION', 'COLLECTION');
CREATE TYPE "GorutPackageCorrectionStatus" AS ENUM ('OPEN', 'RESOLVED');

ALTER TABLE "GorutUpzisPackage"
  ADD COLUMN "rosterFrozenAt" TIMESTAMP(3),
  ADD COLUMN "rosterFrozenByUserId" TEXT,
  ADD COLUMN "rosterSourceHash" TEXT;

ALTER TABLE "GorutUpzisPackage" ADD CONSTRAINT "GorutUpzisPackage_roster_freeze_check" CHECK (
  (
    "rosterFrozenAt" IS NULL AND
    "rosterFrozenByUserId" IS NULL AND
    "rosterSourceHash" IS NULL
  ) OR (
    "rosterFrozenAt" IS NOT NULL AND
    "rosterFrozenByUserId" IS NOT NULL AND
    length(btrim(COALESCE("rosterSourceHash", ''))) > 0
  )
) NOT VALID;

ALTER TABLE "GorutUpzisPackageRantingCoverage"
  ADD COLUMN "exclusionReference" TEXT,
  ADD COLUMN "recordedByUserId" TEXT,
  ADD COLUMN "recordedAt" TIMESTAMP(3),
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "activeAtCutoff" BOOLEAN;

ALTER TABLE "GorutUpzisPackageRantingCoverage" ADD CONSTRAINT "GorutPackageCoverage_audit_check" CHECK (
  (
    "status" <> 'EXCLUDED' OR (
      "rantingId" IS NOT NULL AND
      length(btrim(COALESCE("exclusionReason", ''))) > 0 AND
      "recordedByUserId" IS NOT NULL AND
      "recordedAt" IS NOT NULL AND
      length(btrim(COALESCE("idempotencyKey", ''))) > 0
    )
  ) AND
  ("activeAtCutoff" IS NULL OR "rantingId" IS NOT NULL)
) NOT VALID;

ALTER TABLE "GorutWorkflowEvent"
  ADD COLUMN "reasonCode" "GorutReturnReasonCode",
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "commandHash" TEXT;

ALTER TABLE "GorutWorkflowEvent" ADD CONSTRAINT "GorutWorkflowEvent_idempotency_check" CHECK (
  ("idempotencyKey" IS NULL AND "commandHash" IS NULL) OR
  (length(btrim(COALESCE("idempotencyKey", ''))) > 0 AND length(btrim(COALESCE("commandHash", ''))) > 0)
) NOT VALID;

ALTER TABLE "GorutWorkflowEvent" ADD CONSTRAINT "GorutWorkflowEvent_return_reason_check" CHECK (
  (
    "action" = 'RETURN' AND
    "reasonCode" IS NOT NULL AND
    ("reasonCode" <> 'OTHER' OR length(btrim(COALESCE("reason", ''))) > 0)
  ) OR (
    "action" <> 'RETURN' AND "reasonCode" IS NULL
  )
) NOT VALID;

CREATE TABLE "GorutPackageCorrection" (
  "id" TEXT NOT NULL,
  "correctionCode" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "returnEventId" TEXT NOT NULL,
  "targetType" "GorutPackageCorrectionTargetType" NOT NULL,
  "rantingId" TEXT,
  "transactionId" TEXT,
  "collectionId" TEXT,
  "reasonCode" "GorutReturnReasonCode" NOT NULL,
  "reasonText" TEXT,
  "status" "GorutPackageCorrectionStatus" NOT NULL DEFAULT 'OPEN',
  "requestedByUserId" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requestedPackageVersion" INTEGER NOT NULL,
  "resolvedByUserId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolutionNote" TEXT,
  "resolvedPackageVersion" INTEGER,

  CONSTRAINT "GorutPackageCorrection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GorutPackageCorrection_target_check" CHECK (
    ("targetType" = 'PACKAGE' AND "rantingId" IS NULL AND "transactionId" IS NULL AND "collectionId" IS NULL) OR
    ("targetType" = 'RANTING' AND "rantingId" IS NOT NULL AND "transactionId" IS NULL AND "collectionId" IS NULL) OR
    ("targetType" = 'TRANSACTION' AND "rantingId" IS NULL AND "transactionId" IS NOT NULL AND "collectionId" IS NULL) OR
    ("targetType" = 'COLLECTION' AND "rantingId" IS NULL AND "transactionId" IS NULL AND "collectionId" IS NOT NULL)
  ),
  CONSTRAINT "GorutPackageCorrection_reason_check" CHECK (
    "reasonCode" <> 'OTHER' OR length(btrim(COALESCE("reasonText", ''))) > 0
  ),
  CONSTRAINT "GorutPackageCorrection_version_check" CHECK (
    "requestedPackageVersion" >= 1 AND
    ("resolvedPackageVersion" IS NULL OR "resolvedPackageVersion" >= "requestedPackageVersion")
  ),
  CONSTRAINT "GorutPackageCorrection_resolution_check" CHECK (
    (
      "status" = 'OPEN' AND
      "resolvedByUserId" IS NULL AND
      "resolvedAt" IS NULL AND
      "resolutionNote" IS NULL AND
      "resolvedPackageVersion" IS NULL
    ) OR (
      "status" = 'RESOLVED' AND
      "resolvedByUserId" IS NOT NULL AND
      "resolvedAt" IS NOT NULL AND
      length(btrim(COALESCE("resolutionNote", ''))) > 0 AND
      "resolvedPackageVersion" IS NOT NULL
    )
  )
);

CREATE UNIQUE INDEX "GorutPackageCoverage_package_idempotency_key"
  ON "GorutUpzisPackageRantingCoverage"("packageId", "idempotencyKey");
CREATE INDEX "GorutPackageCoverage_activeAtCutoff_idx"
  ON "GorutUpzisPackageRantingCoverage"("packageId", "activeAtCutoff");
CREATE UNIQUE INDEX "GorutWorkflowEvent_package_idempotency_key"
  ON "GorutWorkflowEvent"("packageId", "idempotencyKey");

CREATE UNIQUE INDEX "GorutPackageCorrection_correctionCode_key" ON "GorutPackageCorrection"("correctionCode");
CREATE INDEX "GorutPackageCorrection_package_status_idx" ON "GorutPackageCorrection"("packageId", "status");
CREATE INDEX "GorutPackageCorrection_returnEventId_idx" ON "GorutPackageCorrection"("returnEventId");
CREATE INDEX "GorutPackageCorrection_rantingId_idx" ON "GorutPackageCorrection"("rantingId");
CREATE INDEX "GorutPackageCorrection_transactionId_idx" ON "GorutPackageCorrection"("transactionId");
CREATE INDEX "GorutPackageCorrection_collectionId_idx" ON "GorutPackageCorrection"("collectionId");
CREATE INDEX "GorutPackageCorrection_requestedByUserId_idx" ON "GorutPackageCorrection"("requestedByUserId");
CREATE INDEX "GorutPackageCorrection_resolvedByUserId_idx" ON "GorutPackageCorrection"("resolvedByUserId");
CREATE UNIQUE INDEX "GorutPackageCorrection_open_target_key" ON "GorutPackageCorrection"(
  "packageId",
  "targetType",
  COALESCE("rantingId", ''),
  COALESCE("transactionId", ''),
  COALESCE("collectionId", '')
) WHERE "status" = 'OPEN';

ALTER TABLE "GorutUpzisPackage" ADD CONSTRAINT "GorutUpzisPackage_rosterFrozenByUserId_fkey"
  FOREIGN KEY ("rosterFrozenByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutUpzisPackageRantingCoverage" ADD CONSTRAINT "GorutUpzisPackageRantingCoverage_recordedByUserId_fkey"
  FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutPackageCorrection" ADD CONSTRAINT "GorutPackageCorrection_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "GorutUpzisPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageCorrection" ADD CONSTRAINT "GorutPackageCorrection_returnEventId_fkey"
  FOREIGN KEY ("returnEventId") REFERENCES "GorutWorkflowEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageCorrection" ADD CONSTRAINT "GorutPackageCorrection_rantingId_fkey"
  FOREIGN KEY ("rantingId") REFERENCES "GorutRanting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageCorrection" ADD CONSTRAINT "GorutPackageCorrection_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "GorutTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageCorrection" ADD CONSTRAINT "GorutPackageCorrection_collectionId_fkey"
  FOREIGN KEY ("collectionId") REFERENCES "GorutCollectionBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageCorrection" ADD CONSTRAINT "GorutPackageCorrection_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutPackageCorrection" ADD CONSTRAINT "GorutPackageCorrection_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
