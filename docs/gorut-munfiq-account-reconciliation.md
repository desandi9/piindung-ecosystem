# GORUT Munfiq account reconciliation

Phase 2E.0.5 does not create a `User` for every historical `GorutMunfiq` and does not infer identity from name, phone, email, `memberId`, PLPK assignment, or any other mutable attribute.

An authorized administrator must:

1. Create an active portal `User` through the existing user-management flow, with role `munfiq`. The server issues the immutable public `memberId`.
2. Reconcile the person against the authoritative Munfiq master outside the system. Duplicate or ambiguous Munfiq records must be resolved as a future domain merge concern; the linking command must not guess.
3. Call `POST /api/gorut/munfiq/account-links` with only `userMemberId`, `munfiqCode`, and an optional `reason`.
4. Use the explicit `/relink` command when replacing an active target, or `/revoke` when removing access. Both preserve the old link row.

Only an active `super_admin_pc` currently receives `munfiq.account_links.manage`. `admin_pc`, UPZIS, Kordes/Ranting, and PLPK actors do not receive this authority.

Moving a Munfiq between PLPK records never changes the account link. Future transparency reads must derive historical PLPK attribution from immutable collection facts, not from the Munfiq's current `plpkId`.
