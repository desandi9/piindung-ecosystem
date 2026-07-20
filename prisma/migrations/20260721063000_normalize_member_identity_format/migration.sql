-- Corrective migration to normalize member ID format to match the application verifier alphabet (no 0, 1, I, O)
-- MD5 hex generated IDs might contain 0 and 1, which are translated injectively:
-- '0' -> 'G'
-- '1' -> 'H'
-- Since uppercase MD5 hex does not contain G or H, this is uniqueness-preserving.

-- First, translate any '0' and '1' in currently stored memberIds
UPDATE "User"
SET "memberId" = 'PID-' || translate(substring("memberId" from 5), '01', 'GH')
WHERE "memberId" LIKE 'PID-%';

-- Add a CHECK constraint matching the application format: PID- followed by exactly 12 allowed characters
ALTER TABLE "User" ADD CONSTRAINT "User_memberId_format_check" CHECK ("memberId" ~ '^PID-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$');
