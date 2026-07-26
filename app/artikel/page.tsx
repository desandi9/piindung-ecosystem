import type { Metadata } from "next"
import { PublicPageShell } from "@/components/piindung/public-page-shell"
import { ArticlesHero } from "@/components/piindung/articles-hero"
import { readPublishedArticles } from "@/lib/article-content"
import { SAMPLE_ARTICLES, withArticleFallback } from "@/lib/sample-articles"
import { ArticlesIndexClient } from "@/app/artikel/articles-index-client"

export const metadata: Metadata = { title: "Artikel & Berita | PIINDUNG", description: "Berita dan wawasan terbaru dari PIINDUNG NU Care–LAZISNU Garut." }

export default async function ArticlesPage() {
  const articles = withArticleFallback(await readPublishedArticles(), SAMPLE_ARTICLES)
  return <PublicPageShell><ArticlesHero eyebrow="WAWASAN & INFORMASI" title={<>Cerita, kabar, dan gagasan dari <span className="text-emerald-300">PIINDUNG.</span></>} description="Ikuti perkembangan ekosistem, pelajari cara kerja produk, dan temukan wawasan tentang pelayanan digital yang amanah." /><ArticlesIndexClient articles={articles} /></PublicPageShell>
}
