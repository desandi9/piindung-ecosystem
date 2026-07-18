import { NextResponse } from "next/server"
import { HelpContentValidationError, readHelpContent, toPublicHelpContent } from "@/lib/help-content"

export async function GET() {
  try {
    return NextResponse.json({ help: toPublicHelpContent(await readHelpContent()) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof HelpContentValidationError ? "Konten bantuan tidak valid." : "Gagal memuat pusat bantuan." }, { status: 500 })
  }
}
