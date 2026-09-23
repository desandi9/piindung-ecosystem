-- Phase 2E.0.5 only establishes explicit identity links. Existing User and
-- GorutMunfiq rows are intentionally left untouched and no synthetic links are created.
CREATE TYPE "GorutMunfiqAccountLinkStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "GorutMunfiqAccountLink" (
    "id" TEXT NOT NULL,
    "linkCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "munfiqId" TEXT NOT NULL,
    "status" "GorutMunfiqAccountLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedByUserId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "reason" TEXT,
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GorutMunfiqAccountLink_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GorutMunfiqAccountLink_lifecycle_check" CHECK (
      ("status" = 'ACTIVE' AND "revokedAt" IS NULL AND "revokedByUserId" IS NULL) OR
      ("status" = 'REVOKED' AND "revokedAt" IS NOT NULL AND "revokedByUserId" IS NOT NULL)
    ),
    CONSTRAINT "GorutMunfiqAccountLink_code_check" CHECK (
      length(btrim("linkCode")) > 0 AND length("linkCode") <= 80
    ),
    CONSTRAINT "GorutMunfiqAccountLink_reason_check" CHECK (
      "reason" IS NULL OR (length(btrim("reason")) > 0 AND length("reason") <= 500)
    ),
    CONSTRAINT "GorutMunfiqAccountLink_revoked_reason_check" CHECK (
      "revokedReason" IS NULL OR (length(btrim("revokedReason")) > 0 AND length("revokedReason") <= 500)
    )
);

CREATE UNIQUE INDEX "GorutMunfiqAccountLink_linkCode_key"
  ON "GorutMunfiqAccountLink"("linkCode");

CREATE INDEX "GorutMunfiqAccountLink_userId_status_idx"
  ON "GorutMunfiqAccountLink"("userId", "status");

CREATE INDEX "GorutMunfiqAccountLink_munfiqId_status_idx"
  ON "GorutMunfiqAccountLink"("munfiqId", "status");

CREATE INDEX "GorutMunfiqAccountLink_linkedByUserId_idx"
  ON "GorutMunfiqAccountLink"("linkedByUserId");

CREATE INDEX "GorutMunfiqAccountLink_revokedByUserId_idx"
  ON "GorutMunfiqAccountLink"("revokedByUserId");

-- Prisma 5 cannot express conditional uniqueness. These partial indexes are the
-- concurrency-safe source of truth for the locked V1 active cardinality.
CREATE UNIQUE INDEX "GorutMunfiqAccountLink_one_active_per_user"
  ON "GorutMunfiqAccountLink"("userId")
  WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "GorutMunfiqAccountLink_one_active_per_munfiq"
  ON "GorutMunfiqAccountLink"("munfiqId")
  WHERE "status" = 'ACTIVE';

ALTER TABLE "GorutMunfiqAccountLink"
  ADD CONSTRAINT "GorutMunfiqAccountLink_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutMunfiqAccountLink"
  ADD CONSTRAINT "GorutMunfiqAccountLink_munfiqId_fkey"
  FOREIGN KEY ("munfiqId") REFERENCES "GorutMunfiq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutMunfiqAccountLink"
  ADD CONSTRAINT "GorutMunfiqAccountLink_linkedByUserId_fkey"
  FOREIGN KEY ("linkedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GorutMunfiqAccountLink"
  ADD CONSTRAINT "GorutMunfiqAccountLink_revokedByUserId_fkey"
  FOREIGN KEY ("revokedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
