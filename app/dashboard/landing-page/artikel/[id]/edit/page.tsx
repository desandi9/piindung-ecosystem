"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArticleEditor } from "@/components/landing-page/article-editor"
import type { Article } from "@/lib/article-content"

export default function EditArticlePage() {
  const params = useParams<{ id: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    if (!params.id) return
    setLoading(true); setError("")
    try {
      const response = await fetch("/api/articles?managed=1", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal mengambil artikel terkelola.")
      const found = Array.isArray(data.articles) ? data.articles.find((item: Article) => item.id === params.id) : null
      if (!found) throw new Error("Artikel tidak ditemukan.")
      setArticle(found)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Gagal mengambil artikel terkelola.") }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [params.id])

  return <ArticleEditor mode="edit" article={article} loading={loading} loadError={error} onRetry={load} />
}
