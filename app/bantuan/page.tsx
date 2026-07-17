"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronDown, HelpCircle, KeyRound, Search, Settings, Wrench } from "lucide-react"
import { Poppins } from "next/font/google"
import { useMemo, useState } from "react"
import { PublicFooter } from "@/components/piindung/public-footer"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"
import { DEFAULT_INTEGRATED_APPS } from "@/lib/integrated-apps"
import { cn } from "@/lib/utils"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const appLogos = Object.fromEntries(DEFAULT_INTEGRATED_APPS.map((app) => [app.id, app.iconUrl]))

const products = [
  { name: "GORUT", logo: appLogos.gorut, label: "Bantuan Tersedia", status: "Aktif" },
  { name: "E-Tasyaruf", logo: appLogos.etasyaruf, label: "Panduan Segera Hadir", status: "Segera Hadir" },
  { name: "Mobisnu", logo: appLogos.mobisnu, label: "Panduan Segera Hadir", status: "Segera Hadir" },
  { name: "Arsip Digital", logo: appLogos.arsip, label: "Panduan Segera Hadir", status: "Segera Hadir" },
  { name: "LAZISNU POS", label: "Panduan Segera Hadir", status: "Segera Hadir" },
]

const topics = [
  { title: "Memulai PIINDUNG", description: "Informasi dasar mengenai ekosistem dan cara mengakses layanan.", icon: HelpCircle },
  { title: "Akun dan Akses", description: "Bantuan mengenai login, hak akses, dan penggunaan akun.", icon: KeyRound },
  { title: "Penggunaan Produk", description: "Panduan singkat untuk memahami fitur produk yang tersedia.", icon: Settings },
  { title: "Kendala Teknis", description: "Solusi awal ketika mengalami masalah saat menggunakan sistem.", icon: Wrench },
]

const faqs = [
  { q: "Apa itu PIINDUNG?", a: "PIINDUNG adalah ekosistem digital NU Care–LAZISNU Garut yang membantu pengelolaan informasi, layanan, dan proses organisasi dalam satu lingkungan yang lebih tertata." },
  { q: "Siapa yang dapat menggunakan PIINDUNG?", a: "PIINDUNG digunakan oleh pengurus dan petugas yang memiliki akses sesuai peran masing-masing. Beberapa informasi publik tetap dapat dibuka tanpa login." },
  { q: "Bagaimana cara masuk ke dalam sistem?", a: "Pengguna yang memiliki akun dapat masuk melalui halaman login. Setelah masuk, sistem akan menyesuaikan akses berdasarkan peran pengguna." },
  { q: "Produk apa saja yang tersedia?", a: "Ekosistem PIINDUNG mencakup GORUT serta produk pendukung seperti E-Tasyaruf, Mobisnu, Arsip Digital, dan LAZISNU POS sesuai tahapan pengembangan." },
  { q: "Apa yang harus dilakukan jika tidak bisa masuk?", a: "Periksa kembali data login dan pastikan akun sudah memiliki akses. Jika masih bermasalah, hubungi tim PIINDUNG melalui halaman kontak." },
  { q: "Bagaimana cara menghubungi tim bantuan?", a: "Gunakan halaman Kontak untuk mengirimkan pertanyaan atau kebutuhan bantuan kepada tim NU Care–LAZISNU Garut." },
]

export default function HelpPage() {
  const [query, setQuery] = useState("")
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0].q)

  const normalizedQuery = query.trim().toLowerCase()
  const filteredProducts = useMemo(() => products.filter((product) => `${product.name} ${product.label} ${product.status}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery])
  const filteredTopics = useMemo(() => topics.filter((topic) => `${topic.title} ${topic.description}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery])
  const filteredFaqs = useMemo(() => faqs.filter((faq) => `${faq.q} ${faq.a}`.toLowerCase().includes(normalizedQuery)), [normalizedQuery])
  const hasResults = filteredProducts.length || filteredTopics.length || filteredFaqs.length

  const resetSearch = () => setQuery("")

  return (
    <div className={poppins.className}>
      <main className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-950 dark:bg-slate-950 dark:text-white">
        <PublicThemeDefault />
        <PublicNavbar />
        <section className="relative overflow-hidden px-4 pb-10 pt-32 text-center sm:px-6 sm:pb-14 sm:pt-36 lg:px-8 lg:pt-40">
          <div className="pointer-events-none absolute left-[12%] top-16 h-56 w-56 rounded-full bg-[#15945b]/10 blur-[95px]" aria-hidden="true" />
          <div className="pointer-events-none absolute right-[12%] top-20 h-64 w-64 rounded-full bg-sky-200/25 blur-[100px] dark:bg-sky-500/10" aria-hidden="true" />
          <div className="relative mx-auto max-w-[720px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">PUSAT BANTUAN</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-[#0b1f33] dark:text-white sm:text-5xl lg:text-[60px]">Apa yang Bisa <span className="text-[#15945b]">Kami Bantu?</span></h1>
            <p className="mt-6 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg lg:text-xl">Temukan panduan singkat, jawaban atas pertanyaan umum, dan informasi bantuan untuk menggunakan ekosistem PIINDUNG.</p>
          </div>
          <div className="relative mx-auto mt-10 max-w-[880px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none" style={{ animationDelay: "120ms" }}>
            <label htmlFor="help-search" className="sr-only">Cari panduan atau pertanyaan</label>
            <div className="flex h-16 items-center gap-3 rounded-[20px] border border-[#dde7e2] bg-white px-5 text-left shadow-[0_18px_50px_rgba(7,20,38,0.08)] transition focus-within:border-[#15945b]/45 focus-within:ring-4 focus-within:ring-[#15945b]/10 dark:border-white/10 dark:bg-slate-900">
              <Search className="h-5 w-5 shrink-0 text-[#15945b]" aria-hidden="true" />
              <input id="help-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari panduan atau pertanyaan" className="min-w-0 flex-1 bg-transparent text-base text-[#0b1f33] outline-none placeholder:text-[#7b8792] dark:text-white dark:placeholder:text-slate-400 sm:text-lg" />
              <span className="hidden rounded-full bg-[#15945b] px-4 py-2 text-xs font-semibold text-white sm:inline-flex">Cari</span>
            </div>
          </div>
        </section>

        {hasResults ? (
          <>
            {filteredProducts.length > 0 && <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="products-help-heading"><div className="mb-8 text-center"><h2 id="products-help-heading" className="text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Pilih Produk</h2><p className="mt-3 text-base text-[#566473] dark:text-slate-300">Pilih produk yang ingin dipelajari atau mendapatkan bantuan.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{filteredProducts.map((product, index) => <article key={product.name} className="animate-in fade-in slide-in-from-bottom-4 rounded-[22px] border border-[#dde7e2] bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#15945b]/35 hover:shadow-lg motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-slate-900" style={{ animationDelay: `${index * 80}ms` }}><div className="mx-auto flex h-16 items-center justify-center">{product.logo ? <Image src={product.logo} alt={`Logo ${product.name}`} width={96} height={96} className="max-h-14 w-auto max-w-[130px] object-contain" /> : <span className="rounded-xl border border-dashed border-[#dde7e2] px-3 py-2 text-xs font-medium text-[#7b8792] dark:border-white/10 dark:text-slate-400">Logo belum tersedia</span>}</div><h3 className="mt-5 text-base font-bold text-[#0b1f33] dark:text-white">{product.name}</h3><p className="mt-2 text-sm text-[#566473] dark:text-slate-300">{product.label}</p><span className={cn("mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold", product.status === "Aktif" ? "bg-[#e6f7ee] text-[#15945b]" : "bg-amber-50 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200")}>{product.status}</span></article>)}</div></section>}

            {filteredTopics.length > 0 && <section className="border-y border-[#dde7e2] bg-white px-4 py-16 dark:border-white/10 dark:bg-slate-950 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="help-topics-heading"><div className="mx-auto max-w-7xl"><div className="mb-10 text-center"><h2 id="help-topics-heading" className="text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Topik Bantuan</h2></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{filteredTopics.map(({ title, description, icon: Icon }, index) => <article key={title} className="animate-in fade-in slide-in-from-bottom-4 rounded-[22px] border border-[#dde7e2] bg-white p-6 shadow-sm duration-700 fill-mode-both motion-reduce:animate-none dark:border-white/10 dark:bg-slate-900" style={{ animationDelay: `${index * 90}ms` }}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-300/10 dark:text-emerald-300"><Icon className="h-6 w-6" aria-hidden="true" /></div><h3 className="mt-6 text-lg font-semibold text-[#0b1f33] dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-[#566473] dark:text-slate-300">{description}</p></article>)}</div></div></section>}

            {filteredFaqs.length > 0 && <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="faq-heading"><div className="mb-8 text-center"><h2 id="faq-heading" className="text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white">Pertanyaan yang Sering Diajukan</h2></div><div className="space-y-3">{filteredFaqs.map((faq) => { const isOpen = openFaq === faq.q; return <div key={faq.q} className="rounded-[18px] border border-[#dde7e2] bg-white shadow-sm dark:border-white/10 dark:bg-slate-900"><button type="button" onClick={() => setOpenFaq(isOpen ? null : faq.q)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-[#0b1f33] transition hover:text-[#15945b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:text-white"><span>{faq.q}</span><ChevronDown className={cn("h-5 w-5 shrink-0 text-[#15945b] transition-transform duration-[350ms]", isOpen && "rotate-180")} aria-hidden="true" /></button><div className={cn("grid transition-all duration-[400ms]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
<div className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-7 text-[#566473] dark:text-slate-300">{faq.a}</p></div></div></div> })}</div></section>}
          </>
        ) : (
          <section className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8"><div className="rounded-[24px] border border-[#dde7e2] bg-white px-6 py-10 shadow-sm dark:border-white/10 dark:bg-slate-900"><h2 className="text-2xl font-bold text-[#0b1f33] dark:text-white">Bantuan tidak ditemukan</h2><p className="mt-3 leading-7 text-[#566473] dark:text-slate-300">Coba gunakan kata kunci lain atau hubungi tim PIINDUNG.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={resetSearch} className="inline-flex h-11 items-center justify-center rounded-full bg-[#15945b] px-5 text-sm font-semibold text-white">Hapus Pencarian</button><Link href="/kontak" className="inline-flex h-11 items-center justify-center rounded-full border border-[#dde7e2] bg-white px-5 text-sm font-semibold text-[#0b1f33] dark:border-white/10 dark:bg-white/5 dark:text-white">Hubungi Kami</Link></div></div></section>
        )}

        <section className="relative isolate overflow-hidden px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8" aria-labelledby="help-cta-heading" style={{ backgroundImage: "url('/BACKGROUND.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0 -z-10 bg-[#071426]/50" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none lg:grid-cols-[1fr_auto] lg:gap-12"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">BANTUAN PIINDUNG</p><h2 id="help-cta-heading" className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Masih Membutuhkan Bantuan?</h2><p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">Hubungi tim NU Care–LAZISNU Garut untuk mendapatkan informasi lebih lanjut mengenai penggunaan PIINDUNG.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:justify-end"><Link href="/kontak" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#071426] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">Hubungi Kami <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">Kembali ke Beranda <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
