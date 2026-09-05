import assert from "node:assert/strict"
import test from "node:test"
// @ts-expect-error Node's native strip-types runner requires the explicit TypeScript extension.
import { buildGorutMunfiqTimeline, currentGorutMunfiqStatus } from "./gorut-munfiq-transparency-pure.ts"

const facts = {
  visitStatus: "COLLECTED",
  entryCreatedAt: new Date("2026-08-01T00:00:00.000Z"),
  collectedAt: new Date("2026-08-02T01:00:00.000Z"),
  submittedToKordesAt: new Date("2026-08-03T02:00:00.000Z"),
  verifiedByKordesAt: new Date("2026-08-04T03:00:00.000Z"),
  workflowEvents: [
    { action: "SUBMIT", stage: "UPZIS", resultingState: "WAITING_UPZIS_VERIFICATION", createdAt: new Date("2026-08-05T04:00:00.000Z") },
    { action: "APPROVE", stage: "UPZIS", resultingState: "WAITING_PC_APPROVAL", createdAt: new Date("2026-08-06T05:00:00.000Z") },
    { action: "APPROVE", stage: "PC", resultingState: "FINAL_APPROVED", createdAt: new Date("2026-08-07T06:00:00.000Z") },
  ],
}

test("full factual PLPK to Kordes to UPZIS to PC timeline uses only public milestones", () => {
  const timeline = buildGorutMunfiqTimeline(facts)
  assert.deepEqual(timeline.map((item) => item.label), [
    "Infak sudah tercatat",
    "Sedang diverifikasi",
    "Sudah diverifikasi",
    "Sedang diproses UPZIS",
    "Sudah diteruskan ke PC",
    "Proses penghimpunan selesai",
  ])
  assert.deepEqual(timeline.map((item) => item.at), [
    "2026-08-02T01:00:00.000Z",
    "2026-08-03T02:00:00.000Z",
    "2026-08-04T03:00:00.000Z",
    "2026-08-05T04:00:00.000Z",
    "2026-08-06T05:00:00.000Z",
    "2026-08-07T06:00:00.000Z",
  ])
  assert.equal(currentGorutMunfiqStatus(timeline)?.label, "Proses penghimpunan selesai")
})

test("incomplete historical workflow never synthesizes package milestones from state", () => {
  const timeline = buildGorutMunfiqTimeline({ ...facts, workflowEvents: [] })
  assert.deepEqual(timeline.map((item) => item.label), ["Infak sudah tercatat", "Sedang diverifikasi", "Sudah diverifikasi"])
  assert.equal(timeline.some((item) => item.label.includes("UPZIS") || item.label.includes("PC") || item.label.includes("selesai")), false)
})

test("pending entry has one factual pending marker and a non-collected outcome has no invented milestone", () => {
  assert.deepEqual(buildGorutMunfiqTimeline({ ...facts, visitStatus: "PENDING", collectedAt: null }), [
    { key: "pending", label: "Belum dijemput", at: "2026-08-01T00:00:00.000Z" },
  ])
  assert.deepEqual(buildGorutMunfiqTimeline({ ...facts, visitStatus: "NOT_READY", collectedAt: null }), [])
})
