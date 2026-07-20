"use client"

import { useEffect, useState } from "react"
import { Poppins } from "next/font/google"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BarChart3, Building, Calendar, HandHeart, MapPin, Package, Shield, Users } from "lucide-react"
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

  useEffect(() => {
    fetch("/api/impact-content")
      .then(res => res.json())
      .then(data => { if (data.content) setContent(data.content) })
      .catch(() => {})
  }, [])

  if (!content) return (
    <div className={poppins.className}>
      <main className="min-h-screen bg-[#f7faf8] dark:bg-slate-950" />
    </div>
  )

  const hero = content.hero
  const cta = content.callToAction

  return (
    <div className={poppins.className}>
      <main className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-950 dark:bg-slate-950 dark:text-white">
        <PublicThemeDefault />
        <PublicNavbar />

        <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
          <div className="pointer-events-none absolute left-[8%] top-20 h-56 w-56 rounded-full bg-[#15945b]/10 blur-[90px]" aria-hidden="true" />
          <div className="pointer-events-none absolute right-[10%] top-32 h-64 w-64 rounded-full bg-sky-200/30 blur-[100px] dark:bg-sky-500/10" aria-hidden="true" />
          <div className="relative mx-auto max-w-[850px] text-center animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">{hero.eyebrow}</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-[#0b1f33] dark:text-white sm:text-5xl lg:text-[60px]">
              {hero.title}<br /><span className="text-[#15945b]">{hero.highlightedText}</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg lg:text-xl">{hero.description}</p>
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
              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {content.achievements.map((ach) => (
                  <article key={ach.id} className="rounded-[22px] border border-[#dde7e2] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <span className="inline-flex rounded-full bg-[#15945b]/10 px-3 py-1 text-xs font-semibold text-[#15945b] dark:text-emerald-300">{ach.year ?? "Milestone"}</span>
                    <h3 className="mt-4 text-xl font-bold text-[#0b1f33] dark:text-white">{ach.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#566473] dark:text-slate-300">{ach.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {content.stories.length > 0 && (
          <section className="border-y border-[#dde7e2] bg-[#f7faf8] px-4 py-16 dark:border-white/10 dark:bg-slate-900/60 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <SectionHeading eyebrow="CERITA PENERIMA MANFAAT" title="Berbagi Dampak" description="Kisah dari mereka yang merasakan langsung manfaat dari program pelayanan." />
              <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {content.stories.map((story) => (
                  <article key={story.id} className="rounded-[22px] border border-[#dde7e2] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
                    <h3 className="mt-2 text-lg font-bold text-[#0b1f33] dark:text-white">{story.title}</h3>
                    {story.location && <p className="mt-1 text-xs font-semibold text-[#15945b]">{story.location}</p>}
                    <p className="mt-3 text-sm leading-7 text-[#566473] dark:text-slate-300">{story.excerpt}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {content.timeline.length > 0 && (
          <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <SectionHeading eyebrow="ALUR DAMPAK" title="Informasi Bergerak dalam Alur yang Terhubung" description="Setiap tahapan saling terhubung agar pelayanan dapat bergerak dari proses awal hingga akhir." />
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
                {content.timeline.map((time, index) => (
                  <div key={time.id} className="relative flex items-center gap-4 rounded-[22px] border border-[#dde7e2] bg-white p-5 shadow-sm lg:flex-col lg:rounded-none lg:border-y lg:border-l lg:p-6 lg:text-center first:lg:rounded-l-[22px] last:lg:rounded-r-[22px] last:lg:border-r">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-300/10 dark:text-emerald-300">
                      <span className="font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-muted-foreground">{time.yearLabel}</span>
                      <span className="mt-1 block text-sm font-semibold text-[#0b1f33] dark:text-white">{time.title}</span>
                    </div>
                    {index < content.timeline.length - 1 && <ArrowRight className="ml-auto h-5 w-5 text-[#15945b] lg:absolute lg:-right-3 lg:top-1/2 lg:z-10 lg:-translate-y-1/2 lg:rounded-full lg:bg-[#f7faf8]" aria-hidden="true" />}
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
      </main>
      <PublicFooter />
    </div>
  )
}
