"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  CreditCard,
  HandCoins,
  LayoutGrid,
  MessageCircle,
  Newspaper,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import { calmEase } from "@/components/piindung/landing-motion"
import { PublicPageShell } from "@/components/piindung/public-page-shell"
import { usePublicProducts } from "@/lib/public-products"
import { cn } from "@/lib/utils"
import type { PublicHelpContent, HelpQuestion, HelpCategory } from "@/lib/help-content"

const SEARCH_SUGGESTIONS = ["Koin NU", "Setoran", "Akun", "Laporan"]

const QUICK_ACTIONS = [
  { href: "/kontak", icon: MessageCircle, title: "Hubungi Kami", description: "Sampaikan pertanyaan langsung ke tim dukungan PIINDUNG." },
  { href: "/produk", icon: LayoutGrid, title: "Panduan Produk", description: "Kenali cara kerja setiap produk dalam ekosistem." },
  { href: "/artikel", icon: Newspaper, title: "Berita & Artikel", description: "Ikuti kabar terbaru dan wawasan seputar pelayanan." },
  { href: "/rekening-donasi", icon: HandCoins, title: "Rekening Donasi", description: "Lihat rekening resmi untuk zakat, infak, dan sedekah." },
]

function iconFor(key: string) {
  if (key === "users") return Users
  if (key === "credit-card") return CreditCard
  if (key === "shield") return Shield
  if (key === "settings") return Settings
  return CircleHelp
}

function fadeUp(reduced: boolean, delay = 0): Variants {
  if (reduced) return { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
  return { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: calmEase, delay } } }
}

/** Per-card reveal — same motion language as the product cards on /produk. */
function cardReveal(reduced: boolean, columns = 4): Variants {
  if (reduced) return { hidden: { opacity: 1, y: 0, scale: 1 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } } }
  return {
    hidden: { opacity: 0, y: 48, scale: 0.96 },
    visible: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: calmEase, delay: (i % columns) * 0.12 } }),
  }
}

export default function HelpPage() {
  const reduced = !!useReducedMotion()
  const [query, setQuery] = useState("")
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("semua")
  const [help, setHelp] = useState<PublicHelpContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const products = usePublicProducts().filter((product) => product.visible).map((product) => ({ id: product.id, name: product.name, logo: product.iconUrl || undefined, label: product.status === "Aktif" ? "Bantuan Tersedia" : "Panduan Segera Hadir", status: product.status, href: product.publicHref || "/produk" }))

  const loadHelp = async () => {
    setLoading(true); setError("")
    try {
      const response = await fetch("/api/help-content", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal memuat pusat bantuan.")
      setHelp(data.help)
      const first = data.help?.categories?.[0]?.questions?.[0]?.id
      setOpenFaq((current) => current ?? first ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pusat bantuan.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadHelp() }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.label} ${product.status}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery, products])
  const filteredCategories = useMemo(() => {
    if (!help) return []
    if (!normalizedQuery) return help.categories
    return help.categories.map((category) => {
      const questions = category.questions.filter((faq) => `${faq.question} ${faq.answer} ${faq.productId ?? ""}`.toLowerCase().includes(normalizedQuery))
      return { ...category, questions }
    }).filter((category) => category.questions.length > 0 || category.title.toLowerCase().includes(normalizedQuery))
  }, [help, normalizedQuery])
  const totalQuestions = useMemo(() => (help?.categories ?? []).reduce((sum, category) => sum + category.questions.length, 0), [help])
  const hasResults = filteredProducts.length || filteredCategories.length
  const resetSearch = () => setQuery("")

  const jumpToFaq = (categoryId: string) => {
    setActiveCategory(categoryId)
    document.getElementById("faq")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  }

  return (
    <PublicPageShell>
      <section className="relative isolate overflow-hidden pb-14 pt-32 sm:pb-16 sm:pt-40 lg:pt-44" aria-labelledby="help-hero-heading">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(8,33,59,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(8,33,59,.035)_1px,transparent_1px)] [background-size:56px_56px] dark:opacity-20" />
        <div className="hero-soft-blob hero-soft-blob-one" aria-hidden="true" />
        <div className="hero-soft-blob hero-soft-blob-two" aria-hidden="true" />
        <div className="hero-soft-blob hero-soft-blob-three" aria-hidden="true" />

        <div className="relative mx-auto max-w-[860px] px-5 text-center sm:px-8">
          <motion.div variants={fadeUp(reduced)} initial="hidden" animate="visible">
            <div className="inline-flex items-center rounded-full border border-[#bfe8d5] bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[.2em] text-[#078f61] shadow-sm dark:border-white/10 dark:bg-white/5">
              PUSAT BANTUAN
            </div>
            <h1 id="help-hero-heading" className="mt-6 text-[clamp(2.25rem,4.6vw,3.75rem)] font-bold leading-[1.08] tracking-[-.045em] text-[#08213b] dark:text-white">
              Ada yang bisa kami <span className="text-[#07965d]">bantu hari ini?</span>
            </h1>
            <p className="mx-auto mt-6 max-w-[620px] text-[15px] leading-[1.85] text-[#6c7a89] dark:text-slate-300 sm:text-base">
              Cari panduan produk, jawaban atas pertanyaan umum, dan jalur kontak resmi — semuanya dalam satu tempat.
            </p>
          </motion.div>

          <motion.div variants={fadeUp(reduced, 0.12)} initial="hidden" animate="visible" className="mx-auto mt-10 max-w-[680px]">
            <label htmlFor="help-search" className="sr-only">Cari panduan atau pertanyaan</label>
            <div className="flex h-16 items-center gap-3 rounded-[22px] border border-[#dce8e2] bg-white px-5 text-left shadow-[0_22px_60px_rgba(9,43,32,.09)] transition focus-within:border-[#07965d]/45 focus-within:ring-4 focus-within:ring-[#07965d]/10 dark:border-white/10 dark:bg-[#0d1e2d]">
              <Search className="h-5 w-5 shrink-0 text-[#07965d]" aria-hidden="true" />
              <input id="help-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, topik, atau pertanyaan" className="min-w-0 flex-1 bg-transparent text-base text-[#08213b] outline-none placeholder:text-[#a0ada7] dark:text-white dark:placeholder:text-slate-400 sm:text-lg" />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold text-[#6c7a89] dark:text-slate-400">Populer:</span>
              {SEARCH_SUGGESTIONS.map((keyword) => (
                <button key={keyword} type="button" onClick={() => setQuery(keyword)} className="rounded-full border border-[#dce8e2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#6c7a89] transition hover:border-[#07965d]/45 hover:text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d] dark:text-slate-300">
                  {keyword}
                </button>
              ))}
            </div>
            {totalQuestions > 0 && <p className="mt-5 text-xs font-semibold uppercase tracking-[.14em] text-[#a0ada7] dark:text-slate-500">{totalQuestions} jawaban siap membantu · {(help?.categories ?? []).length} topik</p>}
          </motion.div>
        </div>
      </section>

      {!normalizedQuery && <QuickActions reduced={reduced} />}

      {error && (
        <section className="mx-auto max-w-3xl px-5 py-8 text-center sm:px-8">
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-300/10 dark:bg-amber-300/10 dark:text-amber-200">
            <p>{error}</p>
            <button onClick={loadHelp} className="mt-4 h-11 rounded-full bg-[#07965d] px-5 text-sm font-semibold text-white transition hover:bg-[#08a969]">Coba Lagi</button>
          </div>
        </section>
      )}

      {loading ? (
        <section className="mx-auto max-w-[1040px] px-5 py-12 sm:px-8">
          <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-[24px] border border-[#dce8e2] bg-white dark:border-white/10 dark:bg-[#0d1e2d]" />)}</div>
        </section>
      ) : hasResults ? (
        <>
          {filteredCategories.length > 0 && <TopicsSection categories={filteredCategories} reduced={reduced} onSelect={jumpToFaq} />}
          {filteredProducts.length > 0 && <ProductSection products={filteredProducts} reduced={reduced} />}
          {filteredCategories.length > 0 && <FaqSection categories={filteredCategories} openFaq={openFaq} setOpenFaq={setOpenFaq} activeCategory={activeCategory} setActiveCategory={setActiveCategory} reduced={reduced} />}
        </>
      ) : (
        <section className="mx-auto max-w-xl px-5 py-16 text-center sm:px-8">
          <div className="rounded-[24px] border border-[#dce8e2] bg-white px-6 py-12 shadow-[0_12px_32px_rgba(9,43,32,.055)] dark:border-white/10 dark:bg-[#0d1e2d]">
            <CircleHelp className="mx-auto h-8 w-8 text-[#07965d]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-bold tracking-[-.035em] text-[#08213b] dark:text-white">Bantuan tidak ditemukan</h2>
            <p className="mt-3 leading-7 text-[#6c7a89] dark:text-slate-300">Coba gunakan kata kunci lain atau hubungi tim PIINDUNG.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={resetSearch} className="inline-flex h-11 items-center justify-center rounded-full bg-[#07965d] px-5 text-sm font-semibold text-white transition hover:bg-[#08a969] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2">Hapus Pencarian</button>
              <Link href="/kontak" className="inline-flex h-11 items-center justify-center rounded-full border border-[#dce8e2] bg-white px-5 text-sm font-semibold text-[#08213b] transition hover:border-[#07965d]/45 hover:text-[#07965d] dark:border-white/10 dark:bg-white/5 dark:text-white">Hubungi Kami</Link>
            </div>
          </div>
        </section>
      )}

      {help && <SupportCta support={help.support} reduced={reduced} />}
      {!help && !loading && !error && (
        <section className="mx-auto max-w-xl px-5 py-16 text-center sm:px-8">
          <div className="rounded-[24px] border border-[#dce8e2] bg-white px-6 py-10 shadow-sm dark:border-white/10 dark:bg-[#0d1e2d]">
            <h2 className="text-2xl font-bold text-[#08213b] dark:text-white">Konten bantuan belum tersedia</h2>
            <p className="mt-3 leading-7 text-[#6c7a89] dark:text-slate-300">Tidak ada FAQ published yang dapat ditampilkan saat ini.</p>
          </div>
        </section>
      )}
    </PublicPageShell>
  )
}

function QuickActions({ reduced }: { reduced: boolean }) {
  const variants = cardReveal(reduced, 4)
  return (
    <section className="mx-auto max-w-[1040px] px-5 pb-4 sm:px-8" aria-label="Aksi cepat">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action, index) => (
          <motion.div key={action.href} custom={index} variants={variants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} whileHover={reduced ? undefined : { y: -6 }} transition={{ duration: 0.38, ease: calmEase }} style={{ animation: "none" }}>
            <Link href={action.href} className="group flex h-full flex-col rounded-[24px] border border-[#dce8e2] bg-white p-6 shadow-[0_12px_32px_rgba(9,43,32,.055)] transition duration-300 hover:border-[#07965d]/45 hover:shadow-[0_16px_38px_rgba(9,43,32,.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d]">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e7f7ef] text-[#07965d] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 dark:bg-emerald-400/10">
                <action.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-base font-bold tracking-[-.025em] text-[#08213b] dark:text-white">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6c7a89] dark:text-slate-300">{action.description}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-[#07965d]">Buka <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function SectionHeading({ eyebrow, title, description, reduced }: { eyebrow: string; title: string; description?: string; reduced: boolean }) {
  return (
    <motion.div variants={fadeUp(reduced)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} className="mb-10 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">{eyebrow}</p>
      <h2 className="mt-3 text-[clamp(1.9rem,3.2vw,2.6rem)] font-bold leading-[1.05] tracking-[-.05em] text-[#08213b] dark:text-white">{title}</h2>
      {description && <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-8 text-[#6c7a89] dark:text-slate-300">{description}</p>}
    </motion.div>
  )
}

function TopicsSection({ categories, reduced, onSelect }: { categories: HelpCategory[]; reduced: boolean; onSelect: (categoryId: string) => void }) {
  const variants = cardReveal(reduced, 3)
  return (
    <section className="mx-auto max-w-[1040px] px-5 py-14 sm:px-8 sm:py-16" aria-labelledby="help-topics-heading">
      <SectionHeading eyebrow="Topik Bantuan" title="Telusuri berdasarkan topik" description="Pilih topik untuk langsung menuju kumpulan jawaban yang relevan." reduced={reduced} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => {
          const Icon = iconFor(category.iconKey)
          return (
            <motion.div key={category.id} custom={index} variants={variants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} whileHover={reduced ? undefined : { y: -6 }} transition={{ duration: 0.38, ease: calmEase }} style={{ animation: "none" }}>
              <button type="button" onClick={() => onSelect(category.id)} className="group flex h-full w-full items-center gap-4 rounded-[24px] border border-[#dce8e2] bg-white p-6 text-left shadow-[0_12px_32px_rgba(9,43,32,.055)] transition duration-300 hover:border-[#07965d]/45 hover:shadow-[0_16px_38px_rgba(9,43,32,.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d]">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e7f7ef] text-[#07965d] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 dark:bg-emerald-400/10">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold tracking-[-.025em] text-[#08213b] dark:text-white">{category.title}</span>
                  <span className="mt-1 block text-xs font-semibold text-[#6c7a89] dark:text-slate-400">{category.questions.length} pertanyaan</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-[#07965d] transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function ProductSection({ products, reduced }: { products: Array<{ id: string; name: string; logo?: string; label: string; status: string; href: string }>; reduced: boolean }) {
  const variants = cardReveal(reduced, 4)
  return (
    <section className="bg-white py-14 dark:bg-transparent sm:py-16" aria-labelledby="products-help-heading">
      <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
        <SectionHeading eyebrow="Bantuan Produk" title="Bantuan berdasarkan produk" description="Pilih produk yang ingin dipelajari atau mendapatkan bantuan." reduced={reduced} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <motion.div key={product.id} custom={index} variants={variants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} whileHover={reduced ? undefined : { y: -6 }} transition={{ duration: 0.38, ease: calmEase }} style={{ animation: "none" }}>
              <Link href={product.href} className="group flex h-full flex-col items-center rounded-[24px] border border-[#dce8e2] bg-white p-6 text-center shadow-[0_12px_32px_rgba(9,43,32,.055)] transition duration-300 hover:border-[#07965d]/45 hover:shadow-[0_16px_38px_rgba(9,43,32,.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d]">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e7f7ef] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 dark:bg-emerald-400/10">
                  {product.logo ? <Image src={product.logo} alt={`Logo ${product.name}`} width={64} height={64} className="h-10 w-10 object-contain" /> : <span className="text-xs font-bold text-[#07965d]">PI</span>}
                </span>
                <h3 className="mt-5 text-base font-bold tracking-[-.025em] text-[#08213b] dark:text-white">{product.name}</h3>
                <p className="mt-1.5 text-sm leading-6 text-[#6c7a89] dark:text-slate-300">{product.label}</p>
                <span className={cn("mt-4 inline-flex rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.12em]", product.status === "Aktif" ? "bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-400/10" : "bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200")}>{product.status}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqSection({ categories, openFaq, setOpenFaq, activeCategory, setActiveCategory, reduced }: { categories: HelpCategory[]; openFaq: string | null; setOpenFaq: (id: string | null) => void; activeCategory: string; setActiveCategory: (id: string) => void; reduced: boolean }) {
  const effectiveCategory = categories.some((category) => category.id === activeCategory) ? activeCategory : "semua"
  const visibleCategories = effectiveCategory === "semua" ? categories : categories.filter((category) => category.id === effectiveCategory)
  const questions = visibleCategories.flatMap((category) => category.questions.map((faq) => ({ ...faq, categoryTitle: category.title })))
  const itemVariants = cardReveal(reduced, 1)
  return (
    <section id="faq" className="mx-auto max-w-[860px] scroll-mt-28 px-5 py-14 sm:px-8 sm:py-16" aria-labelledby="faq-heading">
      <SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering diajukan" reduced={reduced} />
      <div className="mb-8 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter kategori FAQ">
        {[{ id: "semua", title: "Semua" }, ...categories].map((category) => {
          const active = effectiveCategory === category.id
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[.1em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]",
                active ? "bg-[#08213b] text-white shadow-[0_10px_24px_rgba(8,33,59,.22)] dark:bg-white dark:text-[#08213b]" : "border border-[#dce8e2] bg-white text-[#6c7a89] hover:border-[#07965d]/45 hover:text-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d] dark:text-slate-300",
              )}
            >
              {category.title}
            </button>
          )
        })}
      </div>
      <div className="space-y-4" key={activeCategory}>
        {questions.map((faq: HelpQuestion & { categoryTitle: string }, index) => {
          const isOpen = openFaq === faq.id
          return (
            <motion.div key={faq.id} custom={index} variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} style={{ animation: "none" }} className={cn("overflow-hidden rounded-[22px] border bg-white shadow-[0_12px_32px_rgba(9,43,32,.045)] transition-colors duration-300 dark:bg-[#0d1e2d]", isOpen ? "border-[#07965d]/45" : "border-[#dce8e2] dark:border-white/10")}>
              <button type="button" onClick={() => setOpenFaq(isOpen ? null : faq.id)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-[#08213b] transition hover:text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#07965d] dark:text-white">
                <span>
                  <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[.14em] text-[#07965d]">{faq.categoryTitle}{faq.productId ? ` · ${faq.productId}` : ""}</span>
                  {faq.question}
                </span>
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full border transition duration-300", isOpen ? "rotate-180 border-[#07965d]/45 bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-400/10" : "border-[#dce8e2] text-[#6c7a89] dark:border-white/10")}>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
              <div className={cn("grid transition-all", reduced ? "duration-0" : "duration-[400ms]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <p className="whitespace-pre-wrap px-6 pb-6 text-sm leading-7 text-[#6c7a89] dark:text-slate-300">{faq.answer}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function SupportCta({ support, reduced }: { support: PublicHelpContent["support"]; reduced: boolean }) {
  return (
    <section className="px-5 py-12 sm:px-8 sm:py-16" aria-labelledby="help-cta-heading">
      <motion.div variants={fadeUp(reduced)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="relative mx-auto max-w-[1040px] overflow-hidden rounded-[28px] border border-[#07965d] bg-[linear-gradient(135deg,#08a969,#087b59)] px-7 py-12 text-white shadow-[0_24px_56px_rgba(8,169,105,.28)] sm:px-12 sm:py-14 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-5 right-6 select-none text-[110px] font-bold leading-none tracking-[-.1em] text-white/[.07]">?</span>
        <div className="relative max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-emerald-100">Masih butuh bantuan</p>
          <h2 id="help-cta-heading" className="mt-3 text-[clamp(1.9rem,3.4vw,2.75rem)] font-bold leading-[1.08] tracking-[-.045em]">{support.title}</h2>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/80 sm:text-base">{support.description}</p>
        </div>
        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col xl:flex-row">
          <Link href={support.href} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#08213b] shadow-[0_8px_20px_rgba(0,0,0,.12)] transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#087b59]">{support.buttonLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/60 px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#087b59]">Kembali ke Beranda</Link>
        </div>
      </motion.div>
    </section>
  )
}
