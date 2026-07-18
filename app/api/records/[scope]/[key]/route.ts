import { NextResponse } from "next/server"
import { deleteRecord, getRecord, updateRecord } from "@/lib/record-store-server"
import { protectHomepageContentMutation, requireHomepageContentManager } from "@/lib/homepage-content-api"
import { requireArticleManager } from "@/lib/article-content-api"

export async function GET(_: Request, { params }: { params: Promise<{ scope: string; key: string }> | { scope: string; key: string } }) {
  try {
    const { scope, key } = await Promise.resolve(params)
    if (scope === "homepage-content") {
      const access = await requireHomepageContentManager()
      if (access.response) return access.response
    }
    if (scope === "article-migration-map" || scope === "article-legacy-archive") {
      const access = await requireArticleManager()
      if (access.response) return access.response
    }
    const record = await getRecord(scope, key)
    if (!record) return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 })
    return NextResponse.json({ record })
  } catch (error) {
    console.error(`Failed to fetch record`, error)
    return NextResponse.json({ error: "Gagal mengambil data." }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ scope: string; key: string }> | { scope: string; key: string } }) {
  try {
    const { scope, key } = await Promise.resolve(params)
    if (scope === "homepage-content") {
      const access = await requireHomepageContentManager()
      if (access.response) return access.response
    }
    if (scope === "article-migration-map" || scope === "article-legacy-archive") {
      const access = await requireArticleManager()
      if (access.response) return access.response
    }
    const body = (await request.json()) as Record<string, unknown>
    if (scope === "homepage-content") {
      const protection = await protectHomepageContentMutation("update", key, body.type)
      if (protection.response) return protection.response
    }
    const record = await updateRecord(scope, key, body)
    return NextResponse.json({ record })
  } catch (error) {
    console.error(`Failed to update record`, error)
    return NextResponse.json({ error: "Gagal memperbarui data." }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ scope: string; key: string }> | { key: string; scope: string } }) {
  try {
    const { scope, key } = await Promise.resolve(params)
    if (scope === "homepage-content") {
      const access = await requireHomepageContentManager()
      if (access.response) return access.response
      const protection = await protectHomepageContentMutation("delete", key)
      if (protection.response) return protection.response
    }
    if (scope === "article-migration-map" || scope === "article-legacy-archive") {
      const access = await requireArticleManager()
      if (access.response) return access.response
    }
    await deleteRecord(scope, key)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`Failed to delete record`, error)
    return NextResponse.json({ error: "Gagal menghapus data." }, { status: 500 })
  }
}
