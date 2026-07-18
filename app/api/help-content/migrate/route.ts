import { NextResponse } from "next/server"
import { buildInitialHelpContent, HELP_CONTENT_KEY, HELP_CONTENT_SCOPE, readLegacyFaqManagerRecords, requireHelpContentManager, updateHelpContent } from "@/lib/help-content"
import { getRecord } from "@/lib/record-store-server"

export async function POST() {
  try {
    const access = await requireHelpContentManager()
    if (access.response) return access.response
    const existing = await getRecord(HELP_CONTENT_SCOPE, HELP_CONTENT_KEY)
    if (existing) return NextResponse.json({ help: existing.data, migrated: false })
    const records = await readLegacyFaqManagerRecords()
    const migration = buildInitialHelpContent(new Date().toISOString(), records)
    const saved = await updateHelpContent(migration.content, access.user)
    return NextResponse.json({ help: saved, migrated: true, skippedCount: migration.skippedCount })
  } catch {
    return NextResponse.json({ error: "Gagal memigrasikan konten bantuan." }, { status: 500 })
  }
}
