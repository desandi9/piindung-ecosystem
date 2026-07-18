import { NextResponse } from "next/server"
import { HelpContentValidationError, readHelpContent, requireHelpContentManager, updateHelpContent, validateHelpContent } from "@/lib/help-content"

export async function GET() {
  try {
    const access = await requireHelpContentManager()
    if (access.response) return access.response
    return NextResponse.json({ help: await readHelpContent() })
  } catch {
    return NextResponse.json({ error: "Gagal memuat konten bantuan." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireHelpContentManager()
    if (access.response) return access.response
    const body = await request.json().catch(() => null)
    const help = validateHelpContent(body)
    return NextResponse.json({ help: await updateHelpContent(help, access.user) })
  } catch (error) {
    if (error instanceof HelpContentValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: "Gagal menyimpan konten bantuan." }, { status: 500 })
  }
}
