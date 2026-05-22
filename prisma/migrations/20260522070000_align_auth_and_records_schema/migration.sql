ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Aktif',
  ADD COLUMN IF NOT EXISTS "avatar" TEXT,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'password'
  ) THEN
    EXECUTE '
      UPDATE "User"
      SET
        "phone" = COALESCE("phone", CONCAT(''seed-'', "id")),
        "passwordHash" = COALESCE("passwordHash", "password"),
        "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
      WHERE
        "phone" IS NULL
        OR "passwordHash" IS NULL
        OR "updatedAt" IS NULL
    ';
  ELSE
    EXECUTE '
      UPDATE "User"
      SET
        "phone" = COALESCE("phone", CONCAT(''seed-'', "id")),
        "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
      WHERE
        "phone" IS NULL
        OR "updatedAt" IS NULL
    ';
  END IF;
END $$;

ALTER TABLE "User"
  ALTER COLUMN "phone" SET NOT NULL,
  ALTER COLUMN "passwordHash" SET NOT NULL,
  ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

CREATE TABLE IF NOT EXISTS "AppRecord" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppRecord_scope_key_key" ON "AppRecord"("scope", "key");
CREATE INDEX IF NOT EXISTS "AppRecord_scope_idx" ON "AppRecord"("scope");
