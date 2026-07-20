import { NextResponse } from "next/server"
import { createRecord, listRecords } from "@/lib/record-store-server"
import { requireHomepageContentManager } from "@/lib/homepage-content-api"
import { requireArticleManager } from "@/lib/article-content-api"
import { requireSiteContactManager } from "@/lib/site-contact-server"

export async function GET(_: Request, { params }: { params: Promise<{ scope: string }> | { scope: string } }) {
  try {
    const { scope } = await Promise.resolve(params)
    if (scope === "portal-module-grants" || scope === "portal-access-audit" || scope === "portal-user-audit") {
      return NextResponse.json({ error: "Gunakan endpoint portal access khusus." }, { status: 403 })
    }
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
    if (scope === "portal-module-grants" || scope === "portal-access-audit" || scope === "portal-user-audit") {
      return NextResponse.json({ error: "Gunakan endpoint portal access khusus." }, { status: 403 })
    }
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
