export const gorutMunfiqPublicStatuses = [
  "Belum dijemput",
  "Infak sudah tercatat",
  "Sedang diverifikasi",
  "Sudah diverifikasi",
  "Sedang diproses UPZIS",
  "Sudah diteruskan ke PC",
  "Proses penghimpunan selesai",
] as const

export type GorutMunfiqPublicStatus = (typeof gorutMunfiqPublicStatuses)[number]

export type GorutMunfiqWorkflowFact = {
  action: string
  stage: string | null
  resultingState: string
  createdAt: Date
}

export type GorutMunfiqCollectionFacts = {
  visitStatus: string
  entryCreatedAt: Date
  collectedAt: Date | null
  submittedToKordesAt: Date | null
  verifiedByKordesAt: Date | null
  workflowEvents: GorutMunfiqWorkflowFact[]
}

export type GorutMunfiqTimelineItem = {
  key: "pending" | "recorded" | "verifying" | "verified" | "upzis" | "pc" | "complete"
  label: GorutMunfiqPublicStatus
  at: string
}

function firstEvent(
  events: GorutMunfiqWorkflowFact[],
  predicate: (event: GorutMunfiqWorkflowFact) => boolean,
) {
  return events.filter(predicate).sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())[0]?.createdAt ?? null
}

export function buildGorutMunfiqTimeline(facts: GorutMunfiqCollectionFacts): GorutMunfiqTimelineItem[] {
  if (facts.visitStatus === "PENDING") {
    return [{ key: "pending", label: "Belum dijemput", at: facts.entryCreatedAt.toISOString() }]
  }
  if (facts.visitStatus !== "COLLECTED" || !facts.collectedAt) return []

  const events: Array<{ key: GorutMunfiqTimelineItem["key"]; label: GorutMunfiqPublicStatus; at: Date | null }> = [
    { key: "recorded", label: "Infak sudah tercatat", at: facts.collectedAt },
    { key: "verifying", label: "Sedang diverifikasi", at: facts.submittedToKordesAt },
    { key: "verified", label: "Sudah diverifikasi", at: facts.verifiedByKordesAt },
    {
      key: "upzis",
      label: "Sedang diproses UPZIS",
      at: firstEvent(facts.workflowEvents, (event) => event.action === "SUBMIT" && event.stage === "UPZIS" && event.resultingState === "WAITING_UPZIS_VERIFICATION"),
    },
    {
      key: "pc",
      label: "Sudah diteruskan ke PC",
      at: firstEvent(facts.workflowEvents, (event) => event.action === "APPROVE" && event.stage === "UPZIS" && event.resultingState === "WAITING_PC_APPROVAL"),
    },
    {
      key: "complete",
      label: "Proses penghimpunan selesai",
      at: firstEvent(facts.workflowEvents, (event) => event.action === "APPROVE" && event.stage === "PC" && event.resultingState === "FINAL_APPROVED"),
    },
  ]

  return events
    .filter((event): event is typeof event & { at: Date } => event.at instanceof Date)
    .map((event) => ({ key: event.key, label: event.label, at: event.at.toISOString() }))
}

export function currentGorutMunfiqStatus(timeline: GorutMunfiqTimelineItem[]) {
  return timeline.at(-1) ?? null
}
