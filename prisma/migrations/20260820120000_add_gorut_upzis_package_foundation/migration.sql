-- CreateEnum
CREATE TYPE "GorutPackageRecordOrigin" AS ENUM ('NATIVE', 'COLLECTION_BRIDGE', 'LEGACY_EXCEL');

-- CreateEnum
CREATE TYPE "GorutPackageCoverageStatus" AS ENUM ('INCLUDED', 'EXCLUDED', 'UNRESOLVED');

-- CreateTable
CREATE TABLE "GorutUpzisPackage" (
    "id" TEXT NOT NULL,
    "packageCode" TEXT NOT NULL,
    "kecamatanId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "currentState" "GorutTransactionState" DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "recordOrigin" "GorutPackageRecordOrigin" NOT NULL,
    "isHistorical" BOOLEAN NOT NULL DEFAULT false,
    "workflowHistoryComplete" BOOLEAN NOT NULL DEFAULT true,
    "legacyId" TEXT,
    "sourceRowKey" TEXT,
    "migrationBatchKey" TEXT,
    "grossAmount" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "totalPlpkFee" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3),
    "calculationPolicyVersion" TEXT,
    "financialSourceRevision" INTEGER,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GorutUpzisPackage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GorutUpzisPackage_period_start_check" CHECK (
      "periodStart" = date_trunc('month', "periodStart")::date
    ),
    CONSTRAINT "GorutUpzisPackage_version_check" CHECK ("version" >= 1 AND "revision" >= 1),
    CONSTRAINT "GorutUpzisPackage_financial_check" CHECK (
      "grossAmount" >= 0 AND
      "totalPlpkFee" >= 0 AND
      "netAmount" >= 0 AND
      "netAmount" = "grossAmount" - "totalPlpkFee"
    ),
    CONSTRAINT "GorutUpzisPackage_state_check" CHECK (
      "currentState" IS NULL OR "currentState" IN (
        'DRAFT',
        'WAITING_UPZIS_VERIFICATION',
        'RETURNED_TO_RANTING',
        'WAITING_PC_APPROVAL',
        'RETURNED_TO_UPZIS',
        'FINAL_APPROVED',
        'REJECTED',
        'CANCELLED'
      )
    ),
    CONSTRAINT "GorutUpzisPackage_legacy_origin_check" CHECK (
      "recordOrigin" <> 'LEGACY_EXCEL' OR "isHistorical" = true
    )
);

-- CreateTable
CREATE TABLE "GorutUpzisPackageTransaction" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceVersion" TEXT,
    "sourceHash" TEXT NOT NULL,
    "includedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GorutUpzisPackageTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GorutUpzisPackageTransaction_source_check" CHECK (
      length(btrim("sourceType")) > 0 AND
      length(btrim("sourceKey")) > 0 AND
      length(btrim("sourceHash")) > 0
    )
);

-- CreateTable
CREATE TABLE "GorutUpzisPackageRantingCoverage" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "rantingId" TEXT,
    "status" "GorutPackageCoverageStatus" NOT NULL,
    "sourceRantingKey" TEXT,
    "sourceRantingName" TEXT,
    "exclusionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GorutUpzisPackageRantingCoverage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GorutPackageCoverage_status_check" CHECK (
      (
        "status" = 'INCLUDED' AND
        "rantingId" IS NOT NULL AND
        "exclusionReason" IS NULL
      ) OR (
        "status" = 'EXCLUDED' AND
        "rantingId" IS NOT NULL AND
        length(btrim("exclusionReason")) > 0
      ) OR (
        "status" = 'UNRESOLVED' AND
        (
          length(btrim(COALESCE("sourceRantingKey", ''))) > 0 OR
          length(btrim(COALESCE("sourceRantingName", ''))) > 0
        ) AND
        "exclusionReason" IS NULL
      )
    )
);

-- Make workflow ownership backward-compatible: exactly one transaction or package.
ALTER TABLE "GorutWorkflowEvent" ALTER COLUMN "transactionId" DROP NOT NULL;
ALTER TABLE "GorutWorkflowEvent" ADD COLUMN "packageId" TEXT;
ALTER TABLE "GorutWorkflowEvent" ADD CONSTRAINT "GorutWorkflowEvent_owner_check" CHECK (
  (("transactionId" IS NOT NULL)::integer + ("packageId" IS NOT NULL)::integer) = 1
);

-- CreateIndex
CREATE UNIQUE INDEX "GorutUpzisPackage_packageCode_key" ON "GorutUpzisPackage"("packageCode");
CREATE UNIQUE INDEX "GorutUpzisPackage_kecamatanId_periodStart_key" ON "GorutUpzisPackage"("kecamatanId", "periodStart");
CREATE UNIQUE INDEX "GorutUpzisPackage_recordOrigin_legacyId_key" ON "GorutUpzisPackage"("recordOrigin", "legacyId");
CREATE UNIQUE INDEX "GorutUpzisPackage_migrationBatchKey_sourceRowKey_key" ON "GorutUpzisPackage"("migrationBatchKey", "sourceRowKey");
CREATE INDEX "GorutUpzisPackage_periodStart_idx" ON "GorutUpzisPackage"("periodStart");
CREATE INDEX "GorutUpzisPackage_currentState_idx" ON "GorutUpzisPackage"("currentState");
CREATE INDEX "GorutUpzisPackage_recordOrigin_idx" ON "GorutUpzisPackage"("recordOrigin");

CREATE UNIQUE INDEX "GorutUpzisPackageTransaction_transactionId_key" ON "GorutUpzisPackageTransaction"("transactionId");
CREATE UNIQUE INDEX "GorutUpzisPackageTransaction_sourceType_sourceKey_key" ON "GorutUpzisPackageTransaction"("sourceType", "sourceKey");
CREATE INDEX "GorutUpzisPackageTransaction_packageId_idx" ON "GorutUpzisPackageTransaction"("packageId");

CREATE UNIQUE INDEX "GorutPackageCoverage_package_ranting_key" ON "GorutUpzisPackageRantingCoverage"("packageId", "rantingId");
CREATE UNIQUE INDEX "GorutPackageCoverage_package_source_key" ON "GorutUpzisPackageRantingCoverage"("packageId", "sourceRantingKey");
CREATE INDEX "GorutPackageCoverage_package_status_idx" ON "GorutUpzisPackageRantingCoverage"("packageId", "status");
CREATE INDEX "GorutPackageCoverage_ranting_idx" ON "GorutUpzisPackageRantingCoverage"("rantingId");

CREATE INDEX "GorutWorkflowEvent_packageId_idx" ON "GorutWorkflowEvent"("packageId");

-- AddForeignKey
ALTER TABLE "GorutUpzisPackage" ADD CONSTRAINT "GorutUpzisPackage_kecamatanId_fkey" FOREIGN KEY ("kecamatanId") REFERENCES "GorutKecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutUpzisPackageTransaction" ADD CONSTRAINT "GorutUpzisPackageTransaction_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "GorutUpzisPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutUpzisPackageTransaction" ADD CONSTRAINT "GorutUpzisPackageTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "GorutTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutUpzisPackageRantingCoverage" ADD CONSTRAINT "GorutUpzisPackageRantingCoverage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "GorutUpzisPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GorutUpzisPackageRantingCoverage" ADD CONSTRAINT "GorutUpzisPackageRantingCoverage_rantingId_fkey" FOREIGN KEY ("rantingId") REFERENCES "GorutRanting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutWorkflowEvent" ADD CONSTRAINT "GorutWorkflowEvent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "GorutUpzisPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
