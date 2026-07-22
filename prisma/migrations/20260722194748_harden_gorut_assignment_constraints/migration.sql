-- Harden GorutOperationalAssignment scope integrity
ALTER TABLE "GorutOperationalAssignment" ADD CONSTRAINT "GorutOperationalAssignment_scope_check" CHECK (
  ("role" = 'PC' AND "kecamatanId" IS NULL AND "rantingId" IS NULL AND "plpkId" IS NULL) OR
  ("role" = 'UPZIS' AND "kecamatanId" IS NOT NULL AND "rantingId" IS NULL AND "plpkId" IS NULL) OR
  ("role" = 'RANTING' AND "kecamatanId" IS NULL AND "rantingId" IS NOT NULL AND "plpkId" IS NULL) OR
  ("role" = 'PLPK' AND "kecamatanId" IS NULL AND "rantingId" IS NULL AND "plpkId" IS NOT NULL)
);

-- Ensure a user has only one active assignment for the exact same scope
CREATE UNIQUE INDEX "GorutOperationalAssignment_active_unique" ON "GorutOperationalAssignment" ("userId", "role", COALESCE("kecamatanId", ''), COALESCE("rantingId", ''), COALESCE("plpkId", '')) WHERE "isActive" = true;
