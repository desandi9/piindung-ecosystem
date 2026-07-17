import { Poppins } from "next/font/google"
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileText,
  GitBranch,
  Handshake,
  ListChecks,
  MessagesSquare,
  Search,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react"
import Link from "next/link"
import { PublicFooter } from "@/components/piindung/public-footer"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

const impactCards = [
  { title: "Data Lebih Terpusat", description: "Information from different operational activities can be organized within one connected digital ecosystem.", icon: Database },
  { title: "Proses Lebih Efisien", description: "Repeated manual processes can be reduced through clearer and more structured workflows.", icon: Workflow },
  { title: "Monitoring Lebih Mudah", description: "Operational developments and service activities can be reviewed more quickly and systematically.", icon: BarChart3 },
  { title: "Laporan Lebih Tertata", description: "Information can be summarized into reports that are more consistent, readable, and easier to use.", icon: FileText },
]

const beforeItems = ["Data tersebar di berbagai tempat", "Proses berulang secara manual", "Informasi sulit dipantau bersama", "Laporan membutuhkan waktu lebih lama"]
const afterItems = ["Data tersimpan lebih terpusat", "Alur kerja lebih terstruktur", "Informasi lebih mudah dipantau", "Laporan lebih cepat disusun"]

const impactAreas = [
  { title: "Penghimpunan", description: ["Pencatatan informasi menjadi lebih konsisten", "Data dapat dirangkum secara lebih tertib"], icon: ClipboardCheck },
  { title: "Penyaluran", description: ["Informasi program dan bantuan lebih mudah ditelusuri", "Dokumentasi proses lebih terstruktur"], icon: Handshake },
  { title: "Administrasi", description: ["Dokumen dan data organisasi lebih mudah dikelola", "Proses pencarian informasi lebih sederhana"], icon: FileCheck2 },
  { title: "Pelayanan", description: ["Informasi layanan lebih mudah dijangkau", "Komunikasi dapat dikelola melalui kanal yang lebih terarah"], icon: MessagesSquare },
  { title: "Pelaporan", description: ["Rekap data lebih konsisten", "Informasi lebih mudah dipahami oleh pengurus"], icon: BarChart3 },
]

const workflow = [
  { title: "Data Masuk", icon: Database },
  { title: "Pemeriksaan", icon: Search },
  { title: "Pengelolaan", icon: ListChecks },
  { title: "Pelayanan", icon: Users },
  { title: "Pelaporan", icon: FileText },
]

const audiences = [
  { title: "Pengurus", icon: ShieldCheck, items: ["Informasi lebih mudah dipantau", "Pekerjaan lebih terarah", "Koordinasi lebih jelas"] },
  { title: "Petugas Lapangan", icon: ClipboardCheck, items: ["Pencatatan lebih sederhana", "Proses pemeriksaan lebih terstruktur", "Informasi tidak mudah tercecer"] },
  { title: "Masyarakat", icon: Users, items: ["Akses informasi lebih mudah", "Pelayanan lebih jelas", "Komunikasi lebih terarah"] },
]

const principles = ["Berbasis Kebutuhan", "Mudah Digunakan", "Terintegrasi", "Terus Dievaluasi"]

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg">{description}</p>
    </div>
  )
}

function CheckList({ items, tone = "light" }: { items: string[]; tone?: "light" | "green" }) {
  return (
    <ul className="mt-6 space-y-4">
      {items.map((item) => <li key={item} className={tone === "green" ? "flex items-start gap-3 text-sm leading-7 text-[#315b48] dark:text-emerald-100" : "flex items-start gap-3 text-sm leading-7 text-[#566473] dark:text-slate-300"}><Check className={tone === "green" ? "mt-1 h-4 w-4 shrink-0 text-[#15945b]" : "mt-1 h-4 w-4 shrink-0 text-[#7b8792]"} aria-hidden="true" /> <span>{item}</span></li>)}
    </ul>
  )
}

export default function ImpactPage() {
  return (
    <div className={poppins.className}>
      <main className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-950 dark:bg-slate-950 dark:text-white">
        <PublicThemeDefault />
        <PublicNavbar />

        <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
          <div className="pointer-events-none absolute left-[8%] top-20 h-56 w-56 rounded-full bg-[#15945b]/10 blur-[90px]" aria-hidden="true" />
          <div className="pointer-events-none absolute right-[10%] top-32 h-64 w-64 rounded-full bg-sky-200/30 blur-[100px] dark:bg-sky-500/10" aria-hidden="true" />
          <div className="relative mx-auto max-w-[850px] text-center animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">DAMPAK DIGITALISASI</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-[#0b1f33] dark:text-white sm:text-5xl lg:text-[60px]">Teknologi yang Membantu<br /><span className="text-[#15945b]">Pelayanan Lebih Tertib</span></h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg lg:text-xl">PIINDUNG dikembangkan untuk membantu pengurus bekerja lebih terarah, mengurangi proses berulang, menyatukan informasi, dan menyediakan data yang lebih mudah dipahami serta dipantau.</p>
          </div>
        </section>

        <section className="border-y border-[#dde7e2] bg-white px-4 py-16 dark:border-white/10 dark:bg-slate-950 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="impact-main-heading">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="DAMPAK UTAMA" title="Satu Ekosistem, Banyak Perbaikan" description="PIINDUNG menyatukan dukungan digital untuk membantu proses organisasi dan pelayanan berjalan lebih tertib." />
            <div id="dampak" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {impactCards.map(({ title, description, icon: Icon }, index) => <article key={title} className="animate-in fade-in slide-in-from-bottom-4 rounded-[22px] border border-[#dde7e2] bg-[#f7faf8] p-6 shadow-sm duration-700 fill-mode-both motion-reduce:animate-none dark:border-white/10 dark:bg-slate-900" style={{ animationDelay: `${index * 100}ms` }}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-300/10 dark:text-emerald-300"><Icon className="h-6 w-6" aria-hidden="true" /></div><h3 className="mt-6 text-lg font-semibold text-[#0b1f33] dark:text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-[#566473] dark:text-slate-300">{description}</p></article>)}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="transformation-heading">
          <div className="mx-auto max-w-7xl">
            <SectionHeading eyebrow="TRANSFORMASI DIGITAL" title="Dari Proses Terpisah Menjadi Lebih Terhubung" description="PIINDUNG membantu menyatukan informasi, proses kerja, dan pelayanan dalam alur yang lebih jelas sehingga setiap tahapan dapat dikelola dan dipantau dengan lebih baik." />
            <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <div className="rounded-[26px] border border-[#dde7e2] bg-white p-7 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-8"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[#566473] dark:bg-white/10 dark:text-slate-300"><GitBranch className="h-5 w-5" aria-hidden="true" /></div><h3 className="text-xl font-bold text-[#0b1f33] dark:text-white">Sebelumnya</h3></div><CheckList items={beforeItems} /></div>
              <div className="hidden items-center justify-center lg:flex" aria-hidden="true"><ArrowRight className="h-7 w-7 text-[#15945b]" /></div>
              <div className="rounded-[26px] border border-[#15945b]/25 bg-[#eaf7f0] p-7 shadow-sm dark:border-emerald-300/20 dark:bg-emerald-300/10 sm:p-8"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#15945b] dark:bg-white/10 dark:text-emerald-300"><Workflow className="h-5 w-5" aria-hidden="true" /></div><h3 className="text-xl font-bold text-[#0b1f33] dark:text-white">Dengan PIINDUNG</h3></div><CheckList items={afterItems} tone="green" /></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#dde7e2] bg-white px-4 py-16 dark:border-white/10 dark:bg-slate-950 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="areas-heading">
          <div className="mx-auto max-w-7xl"><SectionHeading eyebrow="AREA DAMPAK" title="Dampak bagi Pelayanan dan Organisasi" description="Dukungan PIINDUNG hadir untuk berbagai aktivitas yang saling terhubung dalam tata kelola dan pelayanan organisasi." /><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{impactAreas.map(({ title, description, icon: Icon }, index) => <article key={title} className="rounded-[22px] border border-[#dde7e2] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#15945b]/35 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-slate-900" style={{ animationDelay: `${index * 80}ms` }}><div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7faf8] text-[#15945b] dark:bg-white/5 dark:text-emerald-300"><Icon className="h-5 w-5" aria-hidden="true" /></div><h3 className="text-lg font-semibold text-[#0b1f33] dark:text-white">{title}</h3></div><CheckList items={description} /></article>)}</div></div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="workflow-heading">
          <div className="mx-auto max-w-7xl"><SectionHeading eyebrow="ALUR DAMPAK" title="Informasi Bergerak dalam Alur yang Terhubung" description="Setiap tahapan saling terhubung agar informasi dapat bergerak dari proses lapangan hingga laporan secara lebih tertib." /><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">{workflow.map(({ title, icon: Icon }, index) => <div key={title} className="relative flex items-center gap-4 rounded-[22px] border border-[#dde7e2] bg-white p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none lg:flex-col lg:rounded-none lg:border-y lg:border-l lg:p-6 lg:text-center first:lg:rounded-l-[22px] last:lg:rounded-r-[22px] last:lg:border-r" style={{ animationDelay: `${index * 100}ms` }}><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-300/10 dark:text-emerald-300"><Icon className="h-5 w-5" aria-hidden="true" /></div><span className="text-sm font-semibold text-[#0b1f33] dark:text-white">{title}</span>{index < workflow.length - 1 && <ArrowRight className="ml-auto h-5 w-5 text-[#15945b] lg:absolute lg:-right-3 lg:top-1/2 lg:z-10 lg:-translate-y-1/2 lg:rounded-full lg:bg-[#f7faf8]" aria-hidden="true" />}</div>)}</div></div>
        </section>

        <section className="border-y border-[#dde7e2] bg-[#f7faf8] px-4 py-16 dark:border-white/10 dark:bg-slate-900/60 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="audience-heading">
          <div className="mx-auto max-w-7xl"><SectionHeading eyebrow="MANFAAT BAGI PENGGUNA" title="Lebih Mudah bagi Pengurus, Lebih Baik bagi Pelayanan" description="Ekosistem yang terhubung membantu setiap pihak memahami informasi dan menjalankan perannya dengan lebih jelas." /><div className="mt-12 grid gap-5 md:grid-cols-3">{audiences.map(({ title, icon: Icon, items }, index) => <article key={title} className="animate-in fade-in slide-in-from-bottom-4 rounded-[22px] border border-[#dde7e2] bg-white p-7 shadow-sm duration-700 fill-mode-both motion-reduce:animate-none dark:border-white/10 dark:bg-slate-900" style={{ animationDelay: `${index * 100}ms` }}><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1f33] text-white dark:bg-emerald-300/15 dark:text-emerald-200"><Icon className="h-6 w-6" aria-hidden="true" /></div><h3 className="mt-6 text-xl font-bold text-[#0b1f33] dark:text-white">{title}</h3><CheckList items={items} /></article>)}</div></div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="development-heading">
          <div className="mx-auto max-w-7xl"><div className="rounded-[28px] border border-[#dde7e2] bg-white px-6 py-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900 sm:px-10"><div className="mx-auto max-w-3xl"><SectionHeading eyebrow="PENGEMBANGAN BERKELANJUTAN" title="Dikembangkan Secara Bertahap, Diperbaiki Secara Berkelanjutan" description="PIINDUNG terus dikembangkan berdasarkan kebutuhan organisasi, kesiapan data, evaluasi penggunaan, dan masukan dari pengurus serta petugas lapangan." /></div><div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">{principles.map((principle) => <div key={principle} className="flex items-center justify-center gap-3 rounded-2xl bg-[#f7faf8] px-4 py-4 text-sm font-semibold text-[#0b1f33] dark:bg-white/5 dark:text-white"><Check className="h-4 w-4 text-[#15945b]" aria-hidden="true" />{principle}</div>)}</div></div></div>
        </section>

        <section className="relative isolate overflow-hidden px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8" aria-labelledby="impact-cta-heading" style={{ backgroundImage: "url('/BACKGROUND.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="absolute inset-0 -z-10 bg-[#071426]/50" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-12"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">PIINDUNG UNTUK ORGANISASI</p><h2 id="impact-cta-heading" className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Bersama Membangun Pelayanan<br className="hidden sm:block" /> yang Lebih Terhubung</h2><p className="mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">Pelajari bagaimana ekosistem PIINDUNG membantu mendukung pelayanan dan tata kelola NU Care–LAZISNU Garut.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:justify-end"><Link href="/produk" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#071426] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">Lihat Produk <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/bantuan" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#071426]">Pusat Bantuan <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></div>
        </section>

        <section className="border-y border-[#dde7e2] bg-white px-4 py-16 dark:border-white/10 dark:bg-slate-950 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="testimonial-heading">
          <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">PENGALAMAN PENGGUNA</p><h2 id="testimonial-heading" className="mt-4 text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">Apa Kata Mereka?</h2><div className="mt-8 rounded-[24px] border border-dashed border-[#b8cfc2] bg-[#f7faf8] px-6 py-10 text-base leading-8 text-[#566473] dark:border-white/15 dark:bg-slate-900 dark:text-slate-300">“Cerita dan pengalaman pengguna akan ditampilkan setelah proses evaluasi dan dokumentasi penggunaan PIINDUNG.”</div></div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
