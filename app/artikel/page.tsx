import type { Metadata } from "next"
import { PublicPageHeader, PublicPageShell } from "@/components/piindung/public-page-shell"
import { readPublishedArticles } from "@/lib/article-content"
import { ArticlesIndexClient } from "@/app/artikel/articles-index-client"

export const metadata: Metadata = {
  title: "Artikel & Berita | PIINDUNG",
  description: "Berita dan wawasan terbaru dari PIINDUNG NU Care–LAZISNU Garut.",
}

export default async function ArticlesPage() {
  const articles = await readPublishedArticles()

  return (
    <PublicPageShell>
      <PublicPageHeader
        eyebrow="WAWASAN & INFORMASI"
        title={<>Artikel &amp; Berita <span className="text-[#15945b]">PIINDUNG</span></>}
        description="Temukan informasi mengenai perkembangan PIINDUNG, digitalisasi layanan, kegiatan NU Care-LAZISNU Garut, panduan penggunaan, serta praktik pengelolaan organisasi yang lebih tertib."
      />
      <ArticlesIndexClient articles={articles} />
    </PublicPageShell>
  )
}
