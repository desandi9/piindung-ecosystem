import { NextResponse } from "next/server"
import { createRecord, listRecords } from "@/lib/record-store-server"

export async function GET(_: Request, { params }: { params: Promise<{ scope: string }> | { scope: string } }) {
  try {
    const { scope } = await Promise.resolve(params)
    const records = await listRecords(scope)
    return NextResponse.json({ records })
  } catch (error) {
    console.error(`Failed to fetch records`, error)
    return NextResponse.json({ error: "Gagal mengambil data." }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ scope: string }> | { scope: string } }) {
  try {
    const { scope } = await Promise.resolve(params)
    const body = (await request.json()) as { key?: string; data?: Record<string, unknown> }
    if (!body.key || !body.data) {
      return NextResponse.json({ error: "Key dan data wajib diisi." }, { status: 400 })
    }

    const record = await createRecord(scope, body.key, body.data)
    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error(`Failed to create record`, error)
    return NextResponse.json({ error: "Gagal menyimpan data." }, { status: 500 })
  }
}
