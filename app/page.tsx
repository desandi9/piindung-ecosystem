import { Poppins } from "next/font/google"
import { ArticlePreview } from "@/components/piindung/article-preview"
import { HelpCenterPreview } from "@/components/piindung/help-center-preview"
import { HowItWorks } from "@/components/piindung/how-it-works"
import { ImpactPreview } from "@/components/piindung/impact-preview"
import { MediaArticles } from "@/components/piindung/media-articles"
import { PublicFooter } from "@/components/piindung/public-footer"
import { HeroSection } from "@/components/piindung/public-hero"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicProducts } from "@/components/piindung/public-products"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

const platformFeatures = [
  {
    icon: "◆",
    title: "Satu Pintu Layanan",
    description: "Beragam produk digital hadir dalam satu ekosistem.",
  },
  {
    icon: "✓",
    title: "Data Lebih Tertib",
    description: "Informasi tersusun dan lebih mudah dipantau.",
  },
  {
    icon: "↗",
    title: "Kolaborasi Lebih Cepat",
    description: "Alur kerja antarunit menjadi lebih jelas.",
  },
]

export default function Home() {
  return (
    <div className={poppins.className}>
      <main className="min-h-screen overflow-x-hidden bg-[#F7FAF8] text-slate-950 dark:bg-slate-950 dark:text-white">
        <PublicThemeDefault />
        <PublicNavbar />
        <HeroSection />

        <section className="bg-white py-16 dark:bg-slate-950 sm:py-20" aria-labelledby="intro-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col items-center text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">TENTANG PLATFORM</p>
              <h2 id="intro-heading" className="text-3xl font-bold tracking-tight text-[#0b1f33] dark:text-white sm:text-4xl">
                Apa Itu PIINDUNG?
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg">
                Pusat Instalasi dan Informasi Donasi Unggulan Nahdliyyin Garut (PIINDUNG) adalah ekosistem digital yang membantu pengurus dan petugas bekerja lebih tertib, cepat, transparan, dan terarah.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {platformFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group animate-in fade-in slide-in-from-bottom-5 duration-700 fill-mode-both rounded-[22px] border border-[#dde7e2] bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-[#15945b]/30 hover:shadow-xl dark:border-white/10 dark:bg-slate-900"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#15945b]/10 text-xl font-bold text-[#15945b] transition-transform duration-500 group-hover:scale-105 dark:bg-emerald-300/10 dark:text-emerald-300" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-[#0b1f33] dark:text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#566473] dark:text-slate-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PublicProducts />
        <HowItWorks />
        <ImpactPreview />
        <ArticlePreview />
        <HelpCenterPreview />
        <MediaArticles />
      </main>
      <PublicFooter />
    </div>
  )
}
