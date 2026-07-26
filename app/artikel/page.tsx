import type { Metadata } from "next"
import { PublicPageHeader, PublicPageShell } from "@/components/piindung/public-page-shell"
import { readPublishedArticles } from "@/lib/article-content"
import { ArticlesIndexClient } from "@/app/artikel/articles-index-client"

export const metadata: Metadata = { title: "Artikel & Berita | PIINDUNG", description: "Berita dan wawasan terbaru dari PIINDUNG NU Care–LAZISNU Garut." }

export default async function ArticlesPage() {
  const articles = await readPublishedArticles()
  return <PublicPageShell><PublicPageHeader index="03" eyebrow="WAWASAN & INFORMASI" title={<>Cerita, kabar, dan gagasan dari <span className="text-[#07965d]">PIINDUNG.</span></>} description="Ikuti perkembangan ekosistem, pelajari cara kerja produk, dan temukan wawasan tentang pelayanan digital yang amanah." /><ArticlesIndexClient articles={articles} /></PublicPageShell>
}
