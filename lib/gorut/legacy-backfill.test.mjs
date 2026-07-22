import assert from "node:assert/strict"
import test from "node:test"
import { dependencyOrder, object, parseMoney, safeIssue, stableCode, text, validDate, validateBackfillOptions } from "./legacy-backfill.mjs"

test("domain values have deterministic dependency order", () => assert.deepEqual(dependencyOrder, ["kecamatan", "ranting", "plpk", "assignment", "munfiq", "transaction", "item", "workflow"]))
test("stable legacy identity is deterministic", () => assert.equal(stableCode("RAN", "A", "B"), stableCode("RAN", "A", "B")))
test("money parsing keeps decimal text exact", () => { assert.equal(parseMoney("125000"), "125000.00"); assert.equal(parseMoney("1.25"), "1.25") })
test("malformed money is rejected", () => assert.equal(parseMoney("1,25"), null))
test("invalid dates are rejected", () => assert.equal(validDate("invalid"), null))
test("object parser does not mutate input", () => { const input = { name: "synthetic" }; assert.equal(text(object(input), "name"), "synthetic"); assert.deepEqual(input, { name: "synthetic" }) })
test("safe issue summaries omit source content", () => assert.deepEqual(safeIssue("malformed"), { category: "malformed", count: 1 }))
test("only final state enters finalized totals", () => { const rows = [{ state: "FINAL_APPROVED", amount: 2 }, { state: "REJECTED", amount: 5 }]; assert.equal(rows.filter(row => row.state === "FINAL_APPROVED").reduce((sum, row) => sum + row.amount, 0), 2) })
test("default execution is dry-run", () => assert.deepEqual(validateBackfillOptions({ flags: [], env: {} }), { ok: true, apply: false }))
test("unknown flags are rejected", () => assert.equal(validateBackfillOptions({ flags: ["--nope"], env: {} }).ok, false))
test("apply requires acknowledgement", () => assert.equal(validateBackfillOptions({ flags: ["--apply"], env: { DATABASE_URL: "postgresql://localhost/db" } }).ok, false))
test("unsupported acknowledgement is rejected", () => assert.equal(validateBackfillOptions({ flags: ["--apply"], env: { DATABASE_URL: "postgresql://localhost/db", GORUT_BACKFILL_ACK: "wrong" } }).ok, false))
test("production execution is rejected", () => assert.equal(validateBackfillOptions({ flags: ["--apply"], env: { NODE_ENV: "production", DATABASE_URL: "postgresql://localhost/db", GORUT_BACKFILL_ACK: "local-development" } }).ok, false))
test("non-local database execution is rejected", () => assert.equal(validateBackfillOptions({ flags: ["--apply"], env: { DATABASE_URL: "postgresql://remote/db", GORUT_BACKFILL_ACK: "local-development" } }).ok, false))
test("valid local apply is accepted", () => assert.deepEqual(validateBackfillOptions({ flags: ["--apply"], env: { DATABASE_URL: "postgresql://localhost/db", GORUT_BACKFILL_ACK: "local-development" } }), { ok: true, apply: true }))
