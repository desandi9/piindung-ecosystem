import { NextResponse } from "next/server"
import { readManagedArticles } from "@/lib/article-content"
import { listRecords } from "@/lib/record-store-server"
import { requireArticleManager } from "@/lib/article-content-api"
import { previewLegacyArticleMigration } from "@/lib/article-legacy-preview"

export async function GET() {
  try {
    const access = await requireArticleManager()
    if (access.response) return access.response

    const [migration, existingArticles, maps, archives] = await Promise.all([
      previewLegacyArticleMigration(),
      readManagedArticles(),
      listRecords("article-migration-map"),
      listRecords("article-legacy-archive"),
    ])

    const archivedKeys = new Set(archives.map((record) => record.key))
    const articleById = new Map(existingArticles.map((article) => [article.id, article]))
    const mappedKeys = new Set(maps.map((record) => record.key))
    for (const candidate of migration.candidates) {
      const map = maps.find((record) => record.key === candidate.legacyReference)?.data
      if (mappedKeys.has(candidate.legacyReference)) candidate.issues.push("Kemungkinan sudah dimigrasi: migration map ditemukan.")
      if (map && typeof map.articleId === "string" && !articleById.has(map.articleId)) candidate.issues.push("Artikel hasil migrasi tidak ditemukan.")
      if (archivedKeys.has(candidate.legacyReference)) candidate.issues.push("Konten sudah diarsipkan.")
    }

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
