import { NextResponse } from "next/server"
import { deleteRecord, updateRecord } from "@/lib/record-store-server"

export async function PATCH(request: Request, { params }: { params: Promise<{ scope: string; key: string }> | { scope: string; key: string } }) {
  try {
    const { scope, key } = await Promise.resolve(params)
    const body = (await request.json()) as Record<string, unknown>
    const record = await updateRecord(scope, key, body)
    return NextResponse.json({ record })
  } catch (error) {
    console.error(`Failed to update record`, error)
    return NextResponse.json({ error: "Gagal memperbarui data." }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ scope: string; key: string }> | { scope: string; key: string } }) {
  try {
    const { scope, key } = await Promise.resolve(params)
    await deleteRecord(scope, key)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`Failed to delete record`, error)
    return NextResponse.json({ error: "Gagal menghapus data." }, { status: 500 })
  }
}
