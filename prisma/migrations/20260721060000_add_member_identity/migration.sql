ALTER TABLE "User" ADD COLUMN "memberId" TEXT;

UPDATE "User"
SET "memberId" = 'PID-' || upper(substr(md5(random()::text || clock_timestamp()::text || id), 1, 12))
WHERE "memberId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "memberId" SET NOT NULL;
CREATE UNIQUE INDEX "User_memberId_key" ON "User"("memberId");
