"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/landing-page/member-shell"
import { usePublicProducts } from "@/lib/public-products"
import type { ImpactContent, ImpactStory, Statistic } from "@/lib/impact-content"
import type { Article } from "@/lib/article-content"
import {
  Activity,
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  Loader2,
  Newspaper,
  Save,
  Sparkles,
} from "lucide-react"

export default function LandingPageSettings() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [impactContent, setImpactContent] = useState<ImpactContent | null>(null)
  const [articles, setArticles] = useState<Article[]>([])

  const [saving, setSaving] = useState(false)
  const [loadingContent, setLoadingContent] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const allProducts = usePublicProducts()
  const ekosistemProducts = allProducts
    .filter((p) => ["gorut", "etasyaruf", "mobisnu", "arsip"].includes(p.id))
    .slice(0, 4)

  useEffect(() => {
    async function loadContent() {
      setLoadingContent(true)
      setLoadError("")
      try {
        const [impactResponse, articlesResponse] = await Promise.all([
          fetch("/api/impact-content/manage", { cache: "no-store" }),
          fetch("/api/articles?managed=1", { cache: "no-store" }),
        ])
        const [impactPayload, articlesPayload] = await Promise.all([
          impactResponse.json().catch(() => ({})),
          articlesResponse.json().catch(() => ({})),
        ])
        if (!impactResponse.ok) throw new Error(impactPayload.error || "Gagal memuat konten dampak.")
        if (!articlesResponse.ok) throw new Error(articlesPayload.error || "Gagal memuat artikel.")
        if (impactPayload.content) setImpactContent(impactPayload.content)
        setArticles(Array.isArray(articlesPayload.articles) ? articlesPayload.articles : [])
      } catch (cause) {
        setLoadError(cause instanceof Error ? cause.message : "Gagal memuat konten beranda.")
      } finally {
        setLoadingContent(false)
      }
    }

    void loadContent()
  }, [])

  const displayedArticles = articles
    .filter((article) => article.status === "published")
    .sort((a, b) => Date.parse(b.publishedAt ?? b.updatedAt) - Date.parse(a.publishedAt ?? a.updatedAt))
    .slice(0, 3)

  async function handleSave() {
    if (!impactContent) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/impact-content/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(impactContent),
      })
      if (!res.ok) throw new Error("Gagal menyimpan.")
      setMessage({ type: "success", text: "Perubahan berhasil disimpan." })
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan saat menyimpan." })
    } finally {
      setSaving(false)
    }
  }

  function updateStat(index: number, updates: Partial<Statistic>) {
    if (!impactContent) return
    const newStats = [...impactContent.statistics]
    newStats[index] = { ...newStats[index], ...updates }
    setImpactContent({ ...impactContent, statistics: newStats })
    setMessage(null)
  }

  function updateStory(index: number, updates: Partial<ImpactStory>) {
    if (!impactContent) return
    const newStories = [...impactContent.stories]
    newStories[index] = { ...newStories[index], ...updates }
    setImpactContent({ ...impactContent, stories: newStories })
    setMessage(null)
  }

  if (isLoading) return <div className="min-h-screen bg-background" />
  if (!user) {
    router.replace("/login?next=/dashboard/landing-page/beranda")
    return <div className="min-h-screen bg-background" />
  }

  if (user.role !== "super_admin_pc" && user.role !== "admin_pc") {
    router.replace("/dashboard")
    return <div className="min-h-screen bg-background" />
  }

  return (
    <MemberLayout title="Pengaturan Beranda" breadcrumb="Kelola Landing Page / Beranda">
      <div className="mx-auto max-w-5xl space-y-6 pb-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.push("/dashboard/landing-page")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Kelola Landing Page
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" /> Preview Beranda
          </a>
        </div>

        {loadingContent && <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">Memuat konten beranda...</div>}
        {loadError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{loadError}</div>}

        <div className="space-y-3">
          <details name="beranda-sections" open className="group rounded-lg border bg-card shadow-sm transition-colors hover:border-[#15945b]/40">
            <summary className="flex cursor-pointer list-none items-start gap-3 p-4 outline-none [&::-webkit-details-marker]:hidden">
              <span className="relative mt-0.5 h-4 w-4 shrink-0 text-muted-foreground">
                <ChevronRight className="absolute inset-0 h-4 w-4 transition-opacity duration-200 group-open:opacity-0" />
                <ChevronDown className="absolute inset-0 h-4 w-4 opacity-0 transition-opacity duration-200 group-open:opacity-100" />
              </span>
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#15945b]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold leading-none">Hero</p>
                    <p className="mt-1 text-xs font-normal text-muted-foreground">Identitas utama landing page</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Tetap</span>
                </div>
              </div>
            </summary>
            <div className="border-t px-4 py-4 sm:px-5">
              <p className="text-sm text-muted-foreground">
                Hero menggunakan identitas utama PIINDUNG dan tampil konsisten pada landing page.
              </p>
            </div>
          </details>

          <details name="beranda-sections" className="group rounded-lg border bg-card shadow-sm transition-colors hover:border-[#15945b]/40">
            <summary className="flex cursor-pointer list-none items-start gap-3 p-4 outline-none [&::-webkit-details-marker]:hidden">
              <span className="relative mt-0.5 h-4 w-4 shrink-0 text-muted-foreground">
                <ChevronRight className="absolute inset-0 h-4 w-4 transition-opacity duration-200 group-open:opacity-0" />
                <ChevronDown className="absolute inset-0 h-4 w-4 opacity-0 transition-opacity duration-200 group-open:opacity-100" />
              </span>
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#15945b]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold leading-none">Tentang</p>
                    <p className="mt-1 text-xs font-normal text-muted-foreground">Profil ringkas organisasi</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Hanya lihat</span>
                </div>
              </div>
            </summary>
            <div className="border-t px-4 py-4 sm:px-5">
              <p className="text-sm text-muted-foreground">
                Bagian Tentang menampilkan profil ringkas organisasi pada landing page.
              </p>
            </div>
          </details>

          <details name="beranda-sections" className="group rounded-lg border bg-card shadow-sm transition-colors hover:border-[#15945b]/40">
            <summary className="flex cursor-pointer list-none items-start gap-3 p-4 outline-none [&::-webkit-details-marker]:hidden">
              <span className="relative mt-0.5 h-4 w-4 shrink-0 text-muted-foreground">
                <ChevronRight className="absolute inset-0 h-4 w-4 transition-opacity duration-200 group-open:opacity-0" />
                <ChevronDown className="absolute inset-0 h-4 w-4 opacity-0 transition-opacity duration-200 group-open:opacity-100" />
              </span>
              <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-[#15945b]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold leading-none">Ekosistem</p>
                    <p className="mt-1 text-xs font-normal text-muted-foreground">Produk digital PIINDUNG</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {ekosistemProducts.length} produk
                  </span>
                </div>
              </div>
            </summary>
            <div className="space-y-4 border-t px-4 py-4 sm:px-5">
              <p className="text-sm text-muted-foreground">
                Preview produk ekosistem yang tampil di landing page. Pengaturan urutan dan visibilitas dilakukan di menu Produk.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {ekosistemProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
                    {product.iconUrl ? (
                      <Image src={product.iconUrl} alt={product.name} width={40} height={40} className="rounded-md object-contain" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium leading-none">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Urutan: {product.position} • {product.visible ? "Tampil" : "Sembunyi"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>

          <details name="beranda-sections" className="group rounded-lg border bg-card shadow-sm transition-colors hover:border-[#15945b]/40">
            <summary className="flex cursor-pointer list-none items-start gap-3 p-4 outline-none [&::-webkit-details-marker]:hidden">
              <span className="relative mt-0.5 h-4 w-4 shrink-0 text-muted-foreground">
                <ChevronRight className="absolute inset-0 h-4 w-4 transition-opacity duration-200 group-open:opacity-0" />
                <ChevronDown className="absolute inset-0 h-4 w-4 opacity-0 transition-opacity duration-200 group-open:opacity-100" />
              </span>
              <Activity className="mt-0.5 h-4 w-4 shrink-0 text-[#15945b]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold leading-none">Dampak &amp; Aktivitas</p>
                    <p className="mt-1 text-xs font-normal text-muted-foreground">Statistik dan cerita dampak</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Dapat dikelola
                  </span>
                </div>
              </div>
            </summary>
            <div className="space-y-6 border-t px-4 py-4 sm:px-5">
              <p className="text-sm text-muted-foreground">
                Ubah urutan dan visibilitas statistik serta cerita dampak langsung dari sini.
              </p>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statistik</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {impactContent?.statistics.slice(0, 3).map((stat, i) => (
                    <div key={stat.id} className="space-y-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
                      <div>
                        <p className="text-lg font-semibold">
                          {stat.prefix}
                          {stat.value}
                          {stat.suffix}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex flex-1 items-center gap-2 text-xs">
                          Visibilitas
                          <input
                            type="checkbox"
                            checked={stat.visible}
                            onChange={(e) => updateStat(i, { visible: e.target.checked })}
                            className="rounded border-input"
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                          Urutan
                          <input
                            type="number"
                            min={0}
                            value={stat.position}
                            onChange={(e) => updateStat(i, { position: Number(e.target.value) })}
                            className="w-16 rounded border p-1"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                  {!impactContent?.statistics.length && (
                    <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">Belum ada statistik aktif.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aktivitas / Cerita</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {impactContent?.stories.slice(0, 3).map((story, i) => (
                    <div key={story.id} className="flex flex-col justify-between space-y-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
                      <div className="space-y-2">
                        {story.image?.path && (
                          <Image
                            src={story.image.path}
                            alt={story.title}
                            width={160}
                            height={90}
                            className="h-20 w-full rounded-md object-cover"
                          />
                        )}
                        <p className="text-sm font-medium leading-tight">{story.title}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                        <label className="flex flex-1 items-center gap-2 text-xs">
                          Status
                          <select
                            value={story.status}
                            onChange={(e) => updateStory(i, { status: e.target.value as "draft" | "published" })}
                            className="rounded border p-1"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Terbit</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                          Urutan
                          <input
                            type="number"
                            min={0}
                            value={story.position}
                            onChange={(e) => updateStory(i, { position: Number(e.target.value) })}
                            className="w-16 rounded border p-1"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                  {!impactContent?.stories.length && (
                    <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">Belum ada cerita dampak.</p>
                  )}
                </div>
              </div>

              {message && (
                <div
                  className={`rounded-md border p-4 text-sm font-medium ${
                    message.type === "success"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {impactContent ? (
                <div className="flex justify-end border-t pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-md bg-[#15945b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12804d] disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Simpan Pengaturan Dampak
                  </button>
                </div>
              ) : null}
            </div>
          </details>

          <details name="beranda-sections" className="group rounded-lg border bg-card shadow-sm transition-colors hover:border-[#15945b]/40">
            <summary className="flex cursor-pointer list-none items-start gap-3 p-4 outline-none [&::-webkit-details-marker]:hidden">
              <span className="relative mt-0.5 h-4 w-4 shrink-0 text-muted-foreground">
                <ChevronRight className="absolute inset-0 h-4 w-4 transition-opacity duration-200 group-open:opacity-0" />
                <ChevronDown className="absolute inset-0 h-4 w-4 opacity-0 transition-opacity duration-200 group-open:opacity-100" />
              </span>
              <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-[#15945b]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold leading-none">Artikel Terbaru</p>
                    <p className="mt-1 text-xs font-normal text-muted-foreground">Preview artikel terbit</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Otomatis
                  </span>
                </div>
              </div>
            </summary>
            <div className="space-y-4 border-t px-4 py-4 sm:px-5">
              <p className="text-sm text-muted-foreground">
                Preview 3 artikel terbit terbaru. Pengaturan artikel otomatis berdasarkan tanggal rilis dan tidak perlu disimpan manual.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {displayedArticles.map((article) => (
                  <div key={article.id} className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
                    {article.coverImage && (
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        width={64}
                        height={48}
                        className="h-12 w-16 rounded object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium">{article.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {article.contentType} •{" "}
                        {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("id-ID") : "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {displayedArticles.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada artikel terbit.</p>
              )}
            </div>
          </details>
        </div>
      </div>
    </MemberLayout>
  )
}
