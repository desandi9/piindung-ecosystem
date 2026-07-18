import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { readManagedArticles } from "@/lib/article-content"
import { requireArticleManager } from "@/lib/article-content-api"
import { previewLegacyArticleMigration } from "@/lib/article-legacy-preview"

export async function GET() {
  try {
    const access = await requireArticleManager()
    if (access.response) return access.response

    const [migration, existingArticles] = await Promise.all([
      previewLegacyArticleMigration(),
      readManagedArticles(),
    ])

    const existingSlugs = new Set(existingArticles.map((article) => article.slug))
    const existingTitles = new Set(existingArticles.map((article) => article.title.toLowerCase()))

    for (const candidate of migration.candidates) {
      if (candidate.slug && existingSlugs.has(candidate.slug)) {
        candidate.issues.push("Slug sudah digunakan oleh artikel terkelola.")
      }
      if (candidate.article && existingTitles.has(candidate.article.title.toLowerCase())) {
        candidate.issues.push("Judul mirip dengan artikel terkelola. Kemungkinan sudah dimigrasi.")
      }
    }

    migration.invalidCount = migration.candidates.filter((candidate) => candidate.article === null || candidate.issues.length > 0).length

    return NextResponse.json({ migration })
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat pratinjau migrasi." }, { status: 500 })
  }
}
