import { NextResponse } from "next/server"
import { deleteRecord, getRecord, updateRecord } from "@/lib/record-store-server"
import { protectHomepageContentMutation, requireHomepageContentManager } from "@/lib/homepage-content-api"
import { requireArticleManager } from "@/lib/article-content-api"
import { requireSiteContactManager } from "@/lib/site-contact-server"

export async function GET(_: Request, { params }: { params: Promise<{ scope: string; key: string }> | { scope: string; key: string } }) {
  try {
    const { scope, key } = await Promise.resolve(params)
    if (scope === "gallery-content") {
      return NextResponse.json({ error: "Gunakan endpoint galeri khusus." }, { status: 403 })
    }
    if (scope === "homepage-content") {
      const access = await requireHomepageContentManager()
      if (access.response) return access.response
    }
    if (scope === "article-migration-map" || scope === "article-legacy-archive" || scope === "faq-manager" || scope === "media-library") {
      const access = await requireArticleManager()
      if (access.response) return access.response
    }
    if (scope === "contact-social") {
      const access = await requireSiteContactManager()
      if (access.response) return access.response
    }
    const allowedScopes = ["system-settings", "homepage-content", "article-migration-map", "article-legacy-archive", "faq-manager", "media-library", "contact-social"]
    if (scope === "download-content" || scope === "download-center") {
      return NextResponse.json({ error: "Gunakan endpoint download khusus." }, { status: 403 })
    }
    if (!allowedScopes.includes(scope)) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 })
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
    if (scope === "gallery-content") {
      return NextResponse.json({ error: "Gunakan endpoint galeri khusus." }, { status: 403 })
    }
    if (scope === "homepage-content") {
      const access = await requireHomepageContentManager()
      if (access.response) return access.response
    }
    if (scope === "article-migration-map" || scope === "article-legacy-archive" || scope === "faq-manager" || scope === "media-library") {
      const access = await requireArticleManager()
      if (access.response) return access.response
    }
    if (scope === "contact-social") {
      const access = await requireSiteContactManager()
      if (access.response) return access.response
    }
    const allowedScopes = ["system-settings", "homepage-content", "article-migration-map", "article-legacy-archive", "faq-manager", "media-library", "contact-social"]
    if (scope === "download-content" || scope === "download-center") {
      return NextResponse.json({ error: "Gunakan endpoint download khusus." }, { status: 403 })
    }
    if (!allowedScopes.includes(scope)) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 })
    }

    const body = (await request.json()) as Record<string, unknown>
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
    if (scope === "gallery-content") {
      return NextResponse.json({ error: "Gunakan endpoint galeri khusus." }, { status: 403 })
    }
    if (scope === "homepage-content") {
      const access = await requireHomepageContentManager()
      if (access.response) return access.response
      const protection = await protectHomepageContentMutation("delete", key)
      if (protection.response) return protection.response
    }
    if (scope === "article-migration-map" || scope === "article-legacy-archive" || scope === "faq-manager" || scope === "media-library") {
      const access = await requireArticleManager()
      if (access.response) return access.response
    }
    if (scope === "contact-social") {
      const access = await requireSiteContactManager()
      if (access.response) return access.response
    }
    const allowedScopes = ["system-settings", "homepage-content", "article-migration-map", "article-legacy-archive", "faq-manager", "media-library", "contact-social"]
    if (scope === "download-content" || scope === "download-center") {
      return NextResponse.json({ error: "Gunakan endpoint download khusus." }, { status: 403 })
    }
    if (!allowedScopes.includes(scope)) {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 })
    }

    await deleteRecord(scope, key)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`Failed to delete record`, error)
    return NextResponse.json({ error: "Gagal menghapus data." }, { status: 500 })
  }
}
