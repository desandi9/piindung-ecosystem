"use client"

import { useEffect, useState } from "react"
import { Poppins } from "next/font/google"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BarChart3, Building, Calendar, HandHeart, MapPin, Package, Shield, Users, RefreshCcw, Eye, EyeOff } from "lucide-react"
import { PublicFooter } from "@/components/piindung/public-footer"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"
import type { ImpactContent, ImpactIconKey } from "@/lib/impact-content"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

function getIcon(key: ImpactIconKey) {
  if (key === "hand-heart") return HandHeart
  if (key === "building") return Building
  if (key === "map-pin") return MapPin
  if (key === "package") return Package
  if (key === "chart") return BarChart3
  if (key === "calendar") return Calendar
  if (key === "shield") return Shield
  return Users
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg">{description}</p>
    </div>
  )
}

export default function ImpactPage() {
  const [content, setContent] = useState<ImpactContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/impact-content", { cache: "no-store" })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json().catch(() => ({}))
      if (data.content) {
        setContent(data.content)
      } else {
        throw new Error("Payload data dampak kosong.")
      }
    } catch (err) {
      console.error("Gagal memuat data dampak:", err)
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const isEmpty = useMemoState(content)

  function useMemoState(data: ImpactContent | null) {
    if (!data) return true
    const hasHero = !!(data.hero.title || data.hero.description)
    const hasStats = data.statistics.length > 0
    const hasAchievements = data.achievements.length > 0
    const hasStories = data.stories.length > 0
    const hasTimeline = data.timeline.length > 0
    return !(hasHero || hasStats || hasAchievements || hasStories || hasTimeline)
  }

  const featuredStory = content?.stories.find(x => x.featured)
  const regularStories = content?.stories.filter(x => !x.featured) ?? []

  return (
    <div className={poppins.className}>
      <main className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-950 dark:bg-slate-950 dark:text-white">
        <PublicThemeDefault />
        <PublicNavbar />

        {loading && (
          <div className="mx-auto max-w-7xl px-4 py-32 sm:px-6 lg:px-8 space-y-12">
            <div className="space-y-4 text-center">
              <div className="mx-auto h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mx-auto h-10 w-96 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mx-auto h-20 max-w-2xl animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-3xl bg-white border border-[#dde7e2] dark:border-white/10 dark:bg-slate-900" />
              ))}
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="mx-auto max-w-md px-4 py-32 text-center space-y-6">
            <div className="rounded-full bg-red-100 p-4 w-16 h-16 flex items-center justify-center mx-auto text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <RefreshCcw className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Gagal Memuat Halaman</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
            </div>
            <button onClick={loadData} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] text-white px-5 text-sm font-semibold hover:bg-[#107947] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-2"><RefreshCcw className="h-4 w-4" /> Coba Lagi</button>
          </div>
        )}

        {!loading && !error && isEmpty && (
          <div className="mx-auto max-w-md px-4 py-32 text-center space-y-4">
            <div className="rounded-full bg-slate-100 p-4 w-16 h-16 flex items-center justify-center mx-auto text-slate-400 dark:bg-slate-900 dark:text-slate-500">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">Belum Ada Informasi Publik</h2>
            <p className="text-sm text-muted-foreground">Konten halaman dampak saat ini sedang disiapkan oleh pengurus.</p>
          </div>
        )}

        {!loading && !error && content && !isEmpty && (
          <>
            <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
              <div className="pointer-events-none absolute left-[8%] top-20 h-56 w-56 rounded-full bg-[#15945b]/10 blur-[90px]" aria-hidden="true" />
              <div className="pointer-events-none absolute right-[10%] top-32 h-64 w-64 rounded-full bg-sky-200/30 blur-[100px] dark:bg-sky-500/10" aria-hidden="true" />
              <div className="relative mx-auto max-w-7xl grid gap-12 lg:grid-cols-2 lg:items-center">
                <div className="max-w-[720px] text-left animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">{content.hero.eyebrow}</p>
                  <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-[#0b1f33] dark:text-white sm:text-5xl lg:text-[56px]">
                    {content.hero.title}<br /><span className="text-[#15945b]">{content.hero.highlightedText}</span>
                  </h1>
                  <p className="mt-7 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg lg:text-xl">{content.hero.description}</p>
                </div>
                {content.hero.image && (
                  <div className="relative w-full h-[300px] sm:h-[400px] rounded-3xl overflow-hidden shadow-md border border-[#dde7e2] dark:border-white/10">
                    <Image src={content.hero.image.path} alt={content.hero.highlightedText || "Gambar dampak utama"} fill className="object-cover" priority unoptimized />
                  </div>
                )}
              </div>
            </section>

            {content.statistics.length > 0 && (
              <section className="border-y border-[#dde7e2] bg-white px-4 py-16 dark:border-white/10 dark:bg-slate-950 sm:px-6 sm:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                  <div id="dampak" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {content.statistics.map((stat, index) => {
                      const Icon = getIcon(stat.iconKey)
                      return (
                        <article key={stat.id} className="animate-in fade-in slide-in-from-bottom-4 rounded-[22px] border border-[#dde7e2] bg-[#f7faf8] p-6 shadow-sm duration-700 fill-mode-both motion-reduce:animate-none dark:border-white/10 dark:bg-slate-900" style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-300/10 dark:text-emerald-300">
                            <Icon className="h-6 w-6" aria-hidden="true" />
                          </div>
                          <div className="mt-6 flex items-baseline gap-1 text-[#0b1f33] dark:text-white">
                            {stat.prefix && <span className="text-xl font-semibold">{stat.prefix}</span>}
                            <span className="text-3xl font-bold">{stat.value}</span>
                            {stat.suffix && <span className="text-xl font-semibold">{stat.suffix}</span>}
                          </div>
                          <h3 className="mt-2 text-sm font-semibold text-[#15945b]">{stat.label}</h3>
                          <p className="mt-1 text-xs leading-6 text-[#566473] dark:text-slate-300">{stat.description}</p>
                        </article>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {content.achievements.length > 0 && (
              <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                  <SectionHeading eyebrow="PENCAPAIAN" title="Langkah-Langkah Besar" description="Catatan perjalanan dan penghargaan yang diraih dalam pelayanan masyarakat." />
                  <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {content.achievements.map((ach) => {
                      const CardWrapper = ach.link ? "a" : "div"
                      const wrapperProps = ach.link ? { href: ach.link, target: "_blank", rel: "noreferrer", className: "group text-left" } : {}
                      return (
                        <CardWrapper key={ach.id} {...(wrapperProps as any)}>
                          <article className="h-full rounded-[22px] border border-[#dde7e2] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between transition hover:-translate-y-1 hover:border-[#15945b]/35 hover:shadow-lg focus-within:ring-2 focus-within:ring-[#15945b]">
                            <div className="space-y-4">
                              {ach.image && (
                                <div className="relative w-full h-[180px] rounded-xl overflow-hidden border border-[#dde7e2] dark:border-white/10 bg-slate-100">
                                  <Image src={ach.image.path} alt={ach.title} fill className="object-cover" unoptimized />
                                </div>
                              )}
                              <span className="inline-flex rounded-full bg-[#15945b]/10 px-3 py-1 text-xs font-semibold text-[#15945b] dark:text-emerald-300">{ach.year ?? "Milestone"}</span>
                              <h3 className="text-xl font-bold text-[#0b1f33] dark:text-white group-hover:text-[#15945b] transition-colors">{ach.title}</h3>
                              <p className="text-sm leading-7 text-[#566473] dark:text-slate-300">{ach.description}</p>
                            </div>
                            {ach.link && (
                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold text-[#15945b] group-hover:underline">
                                Selengkapnya <ArrowRight className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </article>
                        </CardWrapper>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {content.stories.length > 0 && (
              <section className="border-y border-[#dde7e2] bg-[#f7faf8] px-4 py-16 dark:border-white/10 dark:bg-slate-900/60 sm:px-6 sm:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                  <SectionHeading eyebrow="CERITA PENERIMA MANFAAT" title="Berbagi Dampak Nyata" description="Kisah dari mereka yang merasakan langsung manfaat dari program pelayanan filantropi." />

                  {featuredStory && (
                    <div className="mt-12">
                      <article className="rounded-3xl border border-[#dde7e2] bg-white p-6 shadow-md dark:border-white/10 dark:bg-slate-900 grid gap-8 lg:grid-cols-2 lg:items-center">
                        {featuredStory.image && (
                          <div className="relative w-full h-[260px] sm:h-[340px] rounded-2xl overflow-hidden border border-[#dde7e2] dark:border-white/10">
                            <Image src={featuredStory.image.path} alt={featuredStory.title} fill className="object-cover" unoptimized />
                          </div>
                        )}
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex rounded-full bg-[#15945b] px-3 py-1 text-xs font-semibold text-white">Unggulan</span>
                            {featuredStory.location && <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15945b]"><MapPin className="h-3.5 w-3.5" /> {featuredStory.location}</span>}
                            {featuredStory.publishedAt && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {new Date(featuredStory.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>}
                          </div>
                          <h3 className="text-2xl font-bold text-[#0b1f33] dark:text-white leading-tight">{featuredStory.title}</h3>
                          <p className="text-base leading-8 text-[#566473] dark:text-slate-300">{featuredStory.excerpt}</p>
                          <div className="pt-2">
                            <button onClick={() => setExpandedStoryId(expandedStoryId === featuredStory.id ? null : featuredStory.id)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dde7e2] px-4 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:border-white/10 dark:hover:bg-slate-800">
                              {expandedStoryId === featuredStory.id ? <><EyeOff className="h-4 w-4" /> Tutup Cerita</> : <><Eye className="h-4 w-4" /> Baca Selengkapnya</>}
                            </button>
                          </div>
                          {expandedStoryId === featuredStory.id && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm leading-8 text-[#566473] dark:text-slate-300 whitespace-pre-line animate-in fade-in duration-300">
                              {featuredStory.body}
                            </div>
                          )}
                        </div>
                      </article>
                    </div>
                  )}

                  {regularStories.length > 0 && (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {regularStories.map((story) => (
                        <article key={story.id} className="rounded-[22px] border border-[#dde7e2] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between">
                          <div className="space-y-4">
                            {story.image && (
                              <div className="relative w-full h-[180px] rounded-xl overflow-hidden border border-[#dde7e2] dark:border-white/10">
                                <Image src={story.image.path} alt={story.title} fill className="object-cover" unoptimized />
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {story.location && <span className="inline-flex items-center gap-1 font-semibold text-[#15945b]"><MapPin className="h-3 w-3" /> {story.location}</span>}
                              {story.publishedAt && <span className="text-muted-foreground">{new Date(story.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>}
                            </div>
                            <h4 className="text-lg font-bold text-[#0b1f33] dark:text-white leading-snug">{story.title}</h4>
                            <p className="text-sm leading-7 text-[#566473] dark:text-slate-300">{story.excerpt}</p>
                            {expandedStoryId === story.id && (
                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs leading-7 text-[#566473] dark:text-slate-300 whitespace-pre-line animate-in fade-in duration-300">
                                {story.body}
                              </div>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => setExpandedStoryId(expandedStoryId === story.id ? null : story.id)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dde7e2] px-3 text-xs font-semibold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:border-white/10 dark:hover:bg-slate-800">
                              {expandedStoryId === story.id ? <><EyeOff className="h-3.5 w-3.5" /> Tutup</> : <><Eye className="h-3.5 w-3.5" /> Baca Detail</>}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {content.timeline.length > 0 && (
              <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <div className="mx-auto max-w-7xl">
                  <SectionHeading eyebrow="ALUR PELAYANAN" title="Informasi Bergerak dalam Alur yang Terhubung" description="Setiap tahapan alur terdokumentasi agar pelayanan dapat bergerak dari proses awal hingga laporan akhir." />
                  <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
                    {content.timeline.map((time, index) => (
                      <div key={time.id} className="relative flex flex-col justify-between items-start gap-4 rounded-[22px] border border-[#dde7e2] bg-white p-5 shadow-sm lg:rounded-none lg:border-y lg:border-l lg:p-6 first:lg:rounded-l-[22px] last:lg:rounded-r-[22px] last:lg:border-r">
                        <div className="flex w-full items-center justify-between">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-300/10 dark:text-emerald-300">
                            <span className="font-bold text-sm">{index + 1}</span>
                          </div>
                          {index < content.timeline.length - 1 && <ArrowRight className="hidden lg:block h-5 w-5 text-[#15945b] absolute -right-3 top-6 z-10 rounded-full bg-[#f7faf8]" aria-hidden="true" />}
                        </div>
                        <div className="space-y-1">
                          <span className="block text-xs font-semibold text-muted-foreground">{time.yearLabel}</span>
                          <span className="block text-sm font-bold text-[#0b1f33] dark:text-white">{time.title}</span>
                          <p className="block text-xs leading-6 text-[#566473] dark:text-slate-300">{time.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {cta.visible && (
              <section className="relative isolate overflow-hidden px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8" style={cta.backgroundImage ? { backgroundImage: `url('${cta.backgroundImage.path}')`, backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "#0f3460" }}>
                <div className="absolute inset-0 -z-10 bg-[#071426]/70" aria-hidden="true" />
                <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">{cta.eyebrow}</p>
                    <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{cta.title}</h2>
                    <p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">{cta.description}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                    <Link href={cta.primaryHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#071426] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">{cta.primaryLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                    {cta.secondaryHref && <Link href={cta.secondaryHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">{cta.secondaryLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
