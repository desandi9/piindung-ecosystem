-- Immutable non-production snapshot contract for GORUT-PLPK-FEE-V1-PROVISIONAL.
-- This records no approval/SK/SOP metadata and does not enable production use.
ALTER TABLE "GorutCollectionEntry"
  ADD CONSTRAINT "GorutCollectionEntry_provisional_fee_v1_check" CHECK (
    "feePolicyVersion" IS DISTINCT FROM 'GORUT-PLPK-FEE-V1-PROVISIONAL' OR (
      "feeEligibleSnapshot" = ("visitStatus" = 'COLLECTED' AND "amount" > 7000.00) AND
      "plpkFeeSnapshot" = CASE
        WHEN "visitStatus" = 'COLLECTED' AND "amount" > 7000.00 THEN 2500.00
        ELSE 0.00
      END
    )
  ) NOT VALID;

ALTER TABLE "GorutCollectionEntry"
  VALIDATE CONSTRAINT "GorutCollectionEntry_provisional_fee_v1_check";

-- Duplicate protection remains anchored by the existing canonical grain:
-- UNIQUE (batchId, munfiqId), while GorutCollectionBatch is UNIQUE (plpkId, periodStart).
