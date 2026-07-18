import { NextResponse } from "next/server"
import { deleteArticle, getPublishedArticleBySlug, toPublicArticle, updateArticle } from "@/lib/article-content"
import { articleErrorResponse, parseArticlePayload, requireArticleManager } from "@/lib/article-content-api"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = await Promise.resolve(params)
    const article = await getPublishedArticleBySlug(id)
    if (!article) return NextResponse.json({ error: "Artikel tidak ditemukan." }, { status: 404 })
    return NextResponse.json({ article: toPublicArticle(article) })
  } catch (error) {
    return articleErrorResponse(error, "Gagal mengambil artikel.")
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const access = await requireArticleManager()
    if (access.response) return access.response
    const { id } = await Promise.resolve(params)
    const article = await updateArticle(id, await parseArticlePayload(request))
    return NextResponse.json({ article })
  } catch (error) {
    return articleErrorResponse(error, "Gagal memperbarui artikel.")
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const access = await requireArticleManager()
    if (access.response) return access.response
    const { id } = await Promise.resolve(params)
    const article = await deleteArticle(id, {
      actorId: access.user.id,
      actorName: access.user.name,
      actorEmail: access.user.email,
      actorRole: access.user.role,
    })
    return NextResponse.json({ ok: true, articleId: article.id })
  } catch (error) {
    return articleErrorResponse(error, "Gagal menghapus artikel.")
  }
}
