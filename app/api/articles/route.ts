import { NextResponse } from "next/server"
import { createArticle, readManagedArticles, readPublishedArticles, sortArticles, toPublicArticle } from "@/lib/article-content"
import { isArticleContentType } from "@/lib/article-content-rules"
import { articleErrorResponse, parseArticlePayload, requireArticleManager } from "@/lib/article-content-api"

export async function GET(request: Request) {
  try {
    const managed = new URL(request.url).searchParams.get("managed") === "1"
    if (managed) {
      const access = await requireArticleManager()
      if (access.response) return access.response
      return NextResponse.json({ articles: sortArticles(await readManagedArticles()) })
    }

    const searchParams = new URL(request.url).searchParams
    const contentType = searchParams.get("contentType")
    const featured = searchParams.get("featured")
    if (contentType !== null && !isArticleContentType(contentType)) return NextResponse.json({ error: "Filter tipe konten tidak valid." }, { status: 400 })
    if (featured !== null && featured !== "true" && featured !== "false") return NextResponse.json({ error: "Filter featured tidak valid." }, { status: 400 })

    const articles = sortArticles(await readPublishedArticles())
      .filter((article) => contentType === null || article.contentType === contentType)
      .filter((article) => featured === null || article.featured === (featured === "true"))
      .map(toPublicArticle)
    return NextResponse.json({ articles })
  } catch (error) {
    return articleErrorResponse(error, "Gagal mengambil artikel.")
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireArticleManager()
    if (access.response) return access.response

    const article = await createArticle(await parseArticlePayload(request))
    return NextResponse.json({ article }, { status: 201 })
  } catch (error) {
    return articleErrorResponse(error, "Gagal membuat artikel.")
  }
}
