"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronDown, CircleHelp, CreditCard, KeyRound, Search, Settings, Shield, Users, Wrench } from "lucide-react"
import { Poppins } from "next/font/google"
import { useEffect, useMemo, useState } from "react"
import { PublicFooter } from "@/components/piindung/public-footer"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"
import { usePublicProducts } from "@/lib/public-products"
import { cn } from "@/lib/utils"
import type { PublicHelpContent, HelpQuestion, HelpCategory } from "@/lib/help-content"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

function iconFor(key: string) {
  if (key === "users") return Users
  if (key === "credit-card") return CreditCard
  if (key === "shield") return Shield
  if (key === "settings") return Settings
  return CircleHelp
}

export default function HelpPage() {
  const [query, setQuery] = useState("")
  const [openFaq, setOpenFaq] = useState<string | null>(null)
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
  const hasResults = filteredProducts.length || filteredCategories.length
  const resetSearch = () => setQuery("")

  return (
    <div className={poppins.className}>
      <main className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-950 dark:bg-slate-950 dark:text-white">
        <PublicThemeDefault />
        <PublicNavbar />
        <section className="relative overflow-hidden px-4 pb-12 pt-32 text-center sm:px-6 sm:pb-16 sm:pt-36 lg:px-8 lg:pt-40">
          <div className="pointer-events-none absolute left-[10%] top-16 h-72 w-72 rounded-full bg-[#15945b]/15 blur-[110px]" aria-hidden="true" />
          <div className="pointer-events-none absolute right-[8%] top-24 h-80 w-80 rounded-full bg-sky-300/25 blur-[120px] dark:bg-sky-500/10" aria-hidden="true" />
          <div className="relative mx-auto max-w-[760px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">PUSAT BANTUAN PIINDUNG</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-[#0b1f33] dark:text-white sm:text-5xl lg:text-[64px]">Temukan Bantuan <span className="text-[#15945b]">Lebih Cepat</span></h1>
            <p className="mt-6 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg lg:text-xl">Cari panduan produk, jawaban FAQ, dan kontak dukungan resmi dari satu pusat bantuan yang selalu tersinkronisasi.</p>
          </div>
          <div className="relative mx-auto mt-10 max-w-[900px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none" style={{ animationDelay: "120ms" }}>
            <label htmlFor="help-search" className="sr-only">Cari panduan atau pertanyaan</label>
            <div className="flex h-16 items-center gap-3 rounded-[22px] border border-[#dde7e2] bg-white px-5 text-left shadow-[0_22px_60px_rgba(7,20,38,0.09)] transition focus-within:border-[#15945b]/45 focus-within:ring-4 focus-within:ring-[#15945b]/10 dark:border-white/10 dark:bg-slate-900">
              <Search className="h-5 w-5 shrink-0 text-[#15945b]" aria-hidden="true" />
              <input id="help-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk, kategori, atau FAQ" className="min-w-0 flex-1 bg-transparent text-base text-[#0b1f33] outline-none placeholder:text-[#7b8792] dark:text-white dark:placeholder:text-slate-400 sm:text-lg" />
              <span className="hidden rounded-full bg-[#15945b] px-4 py-2 text-xs font-semibold text-white sm:inline-flex">Cari</span>
            </div>
          </div>
        </section>

        {error && <section className="mx-auto max-w-3xl px-4 py-8 text-center"><div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-300/10 dark:bg-amber-300/10 dark:text-amber-200"><p>{error}</p><button onClick={loadHelp} className="mt-4 h-11 rounded-full bg-[#15945b] px-5 text-sm font-semibold text-white">Coba Lagi</button></div></section>}

        {loading ? (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-[24px] bg-white dark:bg-slate-900" />)}</div></section>
        ) : hasResults ? (
          <>
            {filteredProducts.length > 0 && <ProductSection products={filteredProducts} />}
            {filteredCategories.length > 0 && <FaqSection categories={filteredCategories} openFaq={openFaq} setOpenFaq={setOpenFaq} />}
          </>
        ) : (
          <section className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8"><div className="rounded-[24px] border border-[#dde7e2] bg-white px-6 py-10 shadow-sm dark:border-white/10 dark:bg-slate-900"><h2 className="text-2xl font-bold text-[#0b1f33] dark:text-white">Bantuan tidak ditemukan</h2><p className="mt-3 leading-7 text-[#566473] dark:text-slate-300">Coba gunakan kata kunci lain atau hubungi tim PIINDUNG.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={resetSearch} className="inline-flex h-11 items-center justify-center rounded-full bg-[#15945b] px-5 text-sm font-semibold text-white">Hapus Pencarian</button><Link href="/kontak" className="inline-flex h-11 items-center justify-center rounded-full border border-[#dde7e2] bg-white px-5 text-sm font-semibold text-[#0b1f33] dark:border-white/10 dark:bg-white/5 dark:text-white">Hubungi Kami</Link></div></div></section>
        )}

        {help && <SupportCta support={help.support} />}
        {!help && !loading && !error && <section className="mx-auto max-w-xl px-4 py-16 text-center"><div className="rounded-[24px] border border-[#dde7e2] bg-white px-6 py-10 shadow-sm dark:border-white/10 dark:bg-slate-900"><h2 className="text-2xl font-bold text-[#0b1f33] dark:text-white">Konten bantuan belum tersedia</h2><p className="mt-3 leading-7 text-[#566473] dark:text-slate-300">Tidak ada FAQ published yang dapat ditampilkan saat ini.</p></div></section>}
        <PublicFooter />
      </main>
    </div>
  )
}

function ProductSection({ products }: { products: Array<{ id: string; name: string; logo?: string; label: string; status: string; href: string }> }) {
  return <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="products-help-heading"><div className="mb-8 text-center"><h2 id="products-help-heading" className="text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Bantuan Berdasarkan Produk</h2><p className="mt-3 text-base text-[#566473] dark:text-slate-300">Pilih produk yang ingin dipelajari atau mendapatkan bantuan.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{products.map((product, index) => <Link href={product.href} key={product.id} className="animate-in fade-in slide-in-from-bottom-4 rounded-[24px] border border-[#dde7e2] bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#15945b]/35 hover:shadow-lg motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-slate-900" style={{ animationDelay: `${index * 80}ms` }}><div className="mx-auto flex h-16 items-center justify-center">{product.logo ? <Image src={product.logo} alt={`Logo ${product.name}`} width={96} height={96} className="max-h-14 w-auto max-w-[130px] object-contain" /> : <span className="rounded-xl border border-dashed border-[#dde7e2] px-3 py-2 text-xs font-medium text-[#7b8792] dark:border-white/10 dark:text-slate-400">Logo belum tersedia</span>}</div><h3 className="mt-5 text-base font-bold text-[#0b1f33] dark:text-white">{product.name}</h3><p className="mt-2 text-sm text-[#566473] dark:text-slate-300">{product.label}</p><span className={cn("mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold", product.status === "Aktif" ? "bg-[#e6f7ee] text-[#15945b]" : "bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200")}>{product.status}</span></Link>)}</div></section>
}

function FaqSection({ categories, openFaq, setOpenFaq }: { categories: HelpCategory[]; openFaq: string | null; setOpenFaq: (id: string | null) => void }) {
  return <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="faq-heading"><div className="mb-10 text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">FAQ TERPUBLISH</p><h2 id="faq-heading" className="mt-3 text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Pertanyaan yang Sering Diajukan</h2></div><div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]"> <div className="space-y-3">{categories.map((category) => { const Icon = iconFor(category.iconKey); return <div key={category.id} className="rounded-[22px] border border-[#dde7e2] bg-white p-5 dark:border-white/10 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-300/10"><Icon className="h-5 w-5" /></span><div><h3 className="font-bold text-[#0b1f33] dark:text-white">{category.title}</h3><p className="text-xs text-[#566473] dark:text-slate-300">{category.questions.length} FAQ</p></div></div></div>})}</div><div className="space-y-4">{categories.flatMap((category) => category.questions.map((faq) => ({ ...faq, categoryTitle: category.title }))).map((faq: HelpQuestion & { categoryTitle: string }) => { const isOpen = openFaq === faq.id; return <div key={faq.id} className="rounded-[22px] border border-[#dde7e2] bg-white shadow-sm dark:border-white/10 dark:bg-slate-900"><button type="button" onClick={() => setOpenFaq(isOpen ? null : faq.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-[#0b1f33] transition hover:text-[#15945b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:text-white"><span><span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#15945b]">{faq.categoryTitle}{faq.productId ? ` · ${faq.productId}` : ""}</span>{faq.question}</span><ChevronDown className={cn("h-5 w-5 shrink-0 text-[#15945b] transition-transform duration-[350ms]", isOpen && "rotate-180")} aria-hidden="true" /></button><div className={cn("grid transition-all duration-[400ms]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}><div className="overflow-hidden"><p className="whitespace-pre-wrap px-5 pb-5 text-sm leading-7 text-[#566473] dark:text-slate-300">{faq.answer}</p></div></div></div> })}</div></div></section>
}

function SupportCta({ support }: { support: PublicHelpContent["support"] }) {
  return <section className="relative isolate overflow-hidden px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8" aria-labelledby="help-cta-heading" style={{ backgroundImage: "url('/BACKGROUND.png')", backgroundSize: "cover", backgroundPosition: "center" }}><div className="absolute inset-0 -z-10 bg-[#071426]/55" aria-hidden="true" /><div className="relative mx-auto grid max-w-7xl items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none lg:grid-cols-[1fr_auto] lg:gap-12"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">BANTUAN PIINDUNG</p><h2 id="help-cta-heading" className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{support.title}</h2><p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">{support.description}</p></div><div className="flex flex-col gap-3 sm:flex-row lg:justify-end"><Link href={support.href} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#071426] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">{support.buttonLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">Kembali ke Beranda <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></div></section>
}
