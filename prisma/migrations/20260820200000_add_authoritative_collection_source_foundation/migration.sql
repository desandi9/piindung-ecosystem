-- CreateEnum
CREATE TYPE "GorutCollectionStatus" AS ENUM (
  'DRAFT',
  'SCHEDULED',
  'COLLECTING',
  'COLLECTION_COMPLETED',
  'WAITING_KORDES_VERIFICATION',
  'VERIFIED_BY_KORDES',
  'NEEDS_CORRECTION'
);

CREATE TYPE "GorutCollectionVisitStatus" AS ENUM (
  'PENDING',
  'COLLECTED',
  'NOT_AROUND',
  'NOT_READY',
  'DECLINED',
  'DAMAGED_LOST'
);

CREATE TYPE "GorutCollectionRecordOrigin" AS ENUM ('NATIVE', 'LEGACY_IMPORT', 'PROTOTYPE');
CREATE TYPE "GorutCollectionAuthorityStatus" AS ENUM ('UNVERIFIED', 'AUTHORITATIVE');
CREATE TYPE "GorutCollectionFinancialStatus" AS ENUM ('BLOCKED', 'READY');
CREATE TYPE "GorutCollectionRevisionAction" AS ENUM (
  'CREATE',
  'RECORD_ENTRY',
  'CORRECT_ENTRY',
  'CONFIRM_AND_SUBMIT',
  'VERIFY_BY_KORDES',
  'REQUEST_CORRECTION',
  'BRIDGE_TRANSACTION'
);

-- CreateTable
CREATE TABLE "GorutCollectionBatch" (
  "id" TEXT NOT NULL,
  "collectionCode" TEXT NOT NULL,
  "creationIdempotencyKey" TEXT NOT NULL,
  "periodStart" DATE NOT NULL,
  "kecamatanId" TEXT NOT NULL,
  "rantingId" TEXT NOT NULL,
  "plpkId" TEXT NOT NULL,
  "status" "GorutCollectionStatus" NOT NULL DEFAULT 'DRAFT',
  "recordOrigin" "GorutCollectionRecordOrigin" NOT NULL,
  "amountAuthorityStatus" "GorutCollectionAuthorityStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "feeAuthorityStatus" "GorutCollectionAuthorityStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "financialStatus" "GorutCollectionFinancialStatus" NOT NULL DEFAULT 'BLOCKED',
  "financialBlockingReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "grossAmount" DECIMAL(19,2),
  "totalPlpkFee" DECIMAL(19,2),
  "netAmount" DECIMAL(19,2),
  "calculatedAt" TIMESTAMP(3),
  "calculationPolicyVersion" TEXT,
  "financialSourceHash" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "sourceHash" TEXT NOT NULL,
  "confirmedByPlpkAt" TIMESTAMP(3),
  "confirmedByPlpkUserId" TEXT,
  "submittedToKordesAt" TIMESTAMP(3),
  "submittedToKordesByUserId" TEXT,
  "verifiedByKordesAt" TIMESTAMP(3),
  "returnedForCorrectionAt" TIMESTAMP(3),
  "kordesDecisionByUserId" TEXT,
  "kordesMoneyMatches" BOOLEAN,
  "kordesHasDamagedMoney" BOOLEAN,
  "kordesCashReceived" BOOLEAN,
  "kordesNote" TEXT,
  "lockedAt" TIMESTAMP(3),
  "transactionId" TEXT,
  "transactionSourceRevision" INTEGER,
  "transactionSourceHash" TEXT,
  "transactionBridgedAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GorutCollectionBatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GorutCollectionBatch_period_start_check" CHECK (
    "periodStart" = date_trunc('month', "periodStart")::date
  ),
  CONSTRAINT "GorutCollectionBatch_version_check" CHECK (
    "version" >= 1 AND "revision" >= 1
  ),
  CONSTRAINT "GorutCollectionBatch_source_hash_check" CHECK (
    length(btrim("sourceHash")) > 0
  ),
  CONSTRAINT "GorutCollectionBatch_financial_check" CHECK (
    (
      "financialStatus" = 'BLOCKED' AND
      cardinality("financialBlockingReasons") > 0 AND
      ("grossAmount" IS NULL OR ("amountAuthorityStatus" = 'AUTHORITATIVE' AND "grossAmount" >= 0)) AND
      "totalPlpkFee" IS NULL AND
      "netAmount" IS NULL AND
      "calculatedAt" IS NULL AND
      "calculationPolicyVersion" IS NULL AND
      "financialSourceHash" IS NULL
    ) OR (
      "financialStatus" = 'READY' AND
      "amountAuthorityStatus" = 'AUTHORITATIVE' AND
      "feeAuthorityStatus" = 'AUTHORITATIVE' AND
      cardinality("financialBlockingReasons") = 0 AND
      "grossAmount" IS NOT NULL AND "grossAmount" >= 0 AND
      "totalPlpkFee" IS NOT NULL AND "totalPlpkFee" >= 0 AND
      "netAmount" IS NOT NULL AND "netAmount" >= 0 AND
      "netAmount" = "grossAmount" - "totalPlpkFee" AND
      "calculatedAt" IS NOT NULL AND
      length(btrim("calculationPolicyVersion")) > 0 AND
      length(btrim("financialSourceHash")) > 0
    )
  ),
  CONSTRAINT "GorutCollectionBatch_confirmation_check" CHECK (
    (("confirmedByPlpkAt" IS NULL)::integer + ("confirmedByPlpkUserId" IS NULL)::integer) IN (0, 2) AND
    (("submittedToKordesAt" IS NULL)::integer + ("submittedToKordesByUserId" IS NULL)::integer) IN (0, 2) AND
    ("submittedToKordesAt" IS NULL OR "confirmedByPlpkAt" IS NOT NULL)
  ),
  CONSTRAINT "GorutCollectionBatch_kordes_result_check" CHECK (
    NOT ("verifiedByKordesAt" IS NOT NULL AND "returnedForCorrectionAt" IS NOT NULL) AND
    (
      ("verifiedByKordesAt" IS NULL AND "returnedForCorrectionAt" IS NULL AND "kordesDecisionByUserId" IS NULL) OR
      (("verifiedByKordesAt" IS NOT NULL OR "returnedForCorrectionAt" IS NOT NULL) AND "kordesDecisionByUserId" IS NOT NULL)
    )
  ),
  CONSTRAINT "GorutCollectionBatch_status_facts_check" CHECK (
    (
      "status" = 'WAITING_KORDES_VERIFICATION' AND
      "confirmedByPlpkAt" IS NOT NULL AND
      "submittedToKordesAt" IS NOT NULL AND
      "verifiedByKordesAt" IS NULL AND
      "returnedForCorrectionAt" IS NULL AND
      "lockedAt" IS NOT NULL
    ) OR (
      "status" = 'VERIFIED_BY_KORDES' AND
      "verifiedByKordesAt" IS NOT NULL AND
      "returnedForCorrectionAt" IS NULL AND
      "lockedAt" IS NOT NULL
    ) OR (
      "status" = 'NEEDS_CORRECTION' AND
      "verifiedByKordesAt" IS NULL AND
      "returnedForCorrectionAt" IS NOT NULL AND
      "lockedAt" IS NOT NULL
    ) OR (
      "status" IN ('DRAFT', 'SCHEDULED', 'COLLECTING', 'COLLECTION_COMPLETED') AND
      "verifiedByKordesAt" IS NULL AND
      "returnedForCorrectionAt" IS NULL
    )
  ),
  CONSTRAINT "GorutCollectionBatch_bridge_check" CHECK (
    (
      "transactionId" IS NULL AND
      "transactionSourceRevision" IS NULL AND
      "transactionSourceHash" IS NULL AND
      "transactionBridgedAt" IS NULL
    ) OR (
      "transactionId" IS NOT NULL AND
      "transactionSourceRevision" IS NOT NULL AND
      "transactionSourceRevision" >= 1 AND
      length(btrim("transactionSourceHash")) > 0 AND
      "transactionBridgedAt" IS NOT NULL
    )
  )
);

CREATE TABLE "GorutCollectionEntry" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "munfiqId" TEXT NOT NULL,
  "visitStatus" "GorutCollectionVisitStatus" NOT NULL,
  "amount" DECIMAL(19,2) NOT NULL,
  "collectedAt" TIMESTAMP(3),
  "note" TEXT,
  "feeEligibleSnapshot" BOOLEAN,
  "plpkFeeSnapshot" DECIMAL(19,2),
  "feePolicyVersion" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GorutCollectionEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GorutCollectionEntry_amount_check" CHECK (
    "amount" >= 0 AND
    ("visitStatus" = 'COLLECTED' OR "amount" = 0)
  ),
  CONSTRAINT "GorutCollectionEntry_collected_at_check" CHECK (
    ("visitStatus" = 'COLLECTED' AND "collectedAt" IS NOT NULL) OR
    ("visitStatus" <> 'COLLECTED' AND "collectedAt" IS NULL)
  ),
  CONSTRAINT "GorutCollectionEntry_note_check" CHECK (
    "visitStatus" IN ('PENDING', 'COLLECTED') OR length(btrim(COALESCE("note", ''))) > 0
  ),
  CONSTRAINT "GorutCollectionEntry_fee_check" CHECK (
    (
      "feeEligibleSnapshot" IS NULL AND
      "plpkFeeSnapshot" IS NULL AND
      "feePolicyVersion" IS NULL
    ) OR (
      "feeEligibleSnapshot" IS NOT NULL AND
      "plpkFeeSnapshot" IS NOT NULL AND "plpkFeeSnapshot" >= 0 AND
      length(btrim("feePolicyVersion")) > 0 AND
      ("feeEligibleSnapshot" = true OR "plpkFeeSnapshot" = 0)
    )
  ),
  CONSTRAINT "GorutCollectionEntry_source_check" CHECK (
    length(btrim("sourceType")) > 0 AND
    length(btrim("sourceKey")) > 0 AND
    length(btrim("sourceHash")) > 0
  )
);

CREATE TABLE "GorutCollectionRevision" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "action" "GorutCollectionRevisionAction" NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "commandHash" TEXT NOT NULL,
  "reason" TEXT,
  "actorUserId" TEXT NOT NULL,
  "beforeSnapshot" JSONB,
  "afterSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GorutCollectionRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GorutCollectionRevision_fields_check" CHECK (
    "revision" >= 1 AND
    length(btrim("idempotencyKey")) > 0 AND
    length(btrim("commandHash")) > 0
  )
);

CREATE TABLE "GorutCollectionCorrection" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "requestedByUserId" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requestRevision" INTEGER NOT NULL,
  "resolvedByUserId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolutionRevision" INTEGER,

  CONSTRAINT "GorutCollectionCorrection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GorutCollectionCorrection_reason_check" CHECK (
    length(btrim("reason")) > 0 AND "requestRevision" >= 1
  ),
  CONSTRAINT "GorutCollectionCorrection_resolution_check" CHECK (
    (
      "resolvedByUserId" IS NULL AND
      "resolvedAt" IS NULL AND
      "resolutionRevision" IS NULL
    ) OR (
      "resolvedByUserId" IS NOT NULL AND
      "resolvedAt" IS NOT NULL AND
      "resolutionRevision" IS NOT NULL AND
      "resolutionRevision" >= "requestRevision"
    )
  )
);

-- CreateIndex
CREATE UNIQUE INDEX "GorutCollectionBatch_collectionCode_key" ON "GorutCollectionBatch"("collectionCode");
CREATE UNIQUE INDEX "GorutCollectionBatch_creationIdempotencyKey_key" ON "GorutCollectionBatch"("creationIdempotencyKey");
CREATE UNIQUE INDEX "GorutCollectionBatch_transactionId_key" ON "GorutCollectionBatch"("transactionId");
CREATE UNIQUE INDEX "GorutCollectionBatch_plpkId_periodStart_key" ON "GorutCollectionBatch"("plpkId", "periodStart");
CREATE INDEX "GorutCollectionBatch_kecamatan_period_idx" ON "GorutCollectionBatch"("kecamatanId", "periodStart");
CREATE INDEX "GorutCollectionBatch_ranting_period_idx" ON "GorutCollectionBatch"("rantingId", "periodStart");
CREATE INDEX "GorutCollectionBatch_status_period_idx" ON "GorutCollectionBatch"("status", "periodStart");
CREATE INDEX "GorutCollectionBatch_financial_period_idx" ON "GorutCollectionBatch"("financialStatus", "periodStart");
CREATE INDEX "GorutCollectionBatch_recordOrigin_idx" ON "GorutCollectionBatch"("recordOrigin");

CREATE UNIQUE INDEX "GorutCollectionEntry_batchId_munfiqId_key" ON "GorutCollectionEntry"("batchId", "munfiqId");
CREATE UNIQUE INDEX "GorutCollectionEntry_sourceType_sourceKey_key" ON "GorutCollectionEntry"("sourceType", "sourceKey");
CREATE INDEX "GorutCollectionEntry_batch_status_idx" ON "GorutCollectionEntry"("batchId", "visitStatus");
CREATE INDEX "GorutCollectionEntry_munfiqId_idx" ON "GorutCollectionEntry"("munfiqId");

CREATE UNIQUE INDEX "GorutCollectionRevision_batchId_revision_key" ON "GorutCollectionRevision"("batchId", "revision");
CREATE UNIQUE INDEX "GorutCollectionRevision_batchId_idempotencyKey_key" ON "GorutCollectionRevision"("batchId", "idempotencyKey");
CREATE INDEX "GorutCollectionRevision_actor_created_idx" ON "GorutCollectionRevision"("actorUserId", "createdAt");
CREATE INDEX "GorutCollectionRevision_batch_created_idx" ON "GorutCollectionRevision"("batchId", "createdAt");

CREATE UNIQUE INDEX "GorutCollectionCorrection_open_entry_key"
  ON "GorutCollectionCorrection"("entryId") WHERE "resolvedAt" IS NULL;
CREATE INDEX "GorutCollectionCorrection_batch_requested_idx" ON "GorutCollectionCorrection"("batchId", "requestedAt");
CREATE INDEX "GorutCollectionCorrection_entry_resolved_idx" ON "GorutCollectionCorrection"("entryId", "resolvedAt");
CREATE INDEX "GorutCollectionCorrection_requestedBy_idx" ON "GorutCollectionCorrection"("requestedByUserId");
CREATE INDEX "GorutCollectionCorrection_resolvedBy_idx" ON "GorutCollectionCorrection"("resolvedByUserId");

-- AddForeignKey
ALTER TABLE "GorutCollectionBatch" ADD CONSTRAINT "GorutCollectionBatch_kecamatanId_fkey"
  FOREIGN KEY ("kecamatanId") REFERENCES "GorutKecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionBatch" ADD CONSTRAINT "GorutCollectionBatch_rantingId_fkey"
  FOREIGN KEY ("rantingId") REFERENCES "GorutRanting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionBatch" ADD CONSTRAINT "GorutCollectionBatch_plpkId_fkey"
  FOREIGN KEY ("plpkId") REFERENCES "GorutPlpk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionBatch" ADD CONSTRAINT "GorutCollectionBatch_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "GorutTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionBatch" ADD CONSTRAINT "GorutCollectionBatch_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionBatch" ADD CONSTRAINT "GorutCollectionBatch_confirmedByPlpkUserId_fkey"
  FOREIGN KEY ("confirmedByPlpkUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionBatch" ADD CONSTRAINT "GorutCollectionBatch_submittedToKordesByUserId_fkey"
  FOREIGN KEY ("submittedToKordesByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionBatch" ADD CONSTRAINT "GorutCollectionBatch_kordesDecisionByUserId_fkey"
  FOREIGN KEY ("kordesDecisionByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutCollectionEntry" ADD CONSTRAINT "GorutCollectionEntry_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "GorutCollectionBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionEntry" ADD CONSTRAINT "GorutCollectionEntry_munfiqId_fkey"
  FOREIGN KEY ("munfiqId") REFERENCES "GorutMunfiq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutCollectionRevision" ADD CONSTRAINT "GorutCollectionRevision_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "GorutCollectionBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionRevision" ADD CONSTRAINT "GorutCollectionRevision_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutCollectionCorrection" ADD CONSTRAINT "GorutCollectionCorrection_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "GorutCollectionBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionCorrection" ADD CONSTRAINT "GorutCollectionCorrection_entryId_fkey"
  FOREIGN KEY ("entryId") REFERENCES "GorutCollectionEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionCorrection" ADD CONSTRAINT "GorutCollectionCorrection_requestedByUserId_fkey"
  FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutCollectionCorrection" ADD CONSTRAINT "GorutCollectionCorrection_resolvedByUserId_fkey"
  FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
