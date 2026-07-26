import { Poppins } from "next/font/google"
import { PublicFooter } from "@/components/piindung/public-footer"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={poppins.className}>
      <main className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-950 dark:bg-slate-950 dark:text-white">
        <PublicThemeDefault />
        <PublicNavbar />
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}

export function PublicPageHeader({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description: string }) {
  return (
    <header className="relative overflow-hidden px-4 pb-12 pt-32 text-center sm:px-6 sm:pb-16 sm:pt-36 lg:px-8 lg:pt-40">
      <div className="pointer-events-none absolute left-[12%] top-16 h-56 w-56 rounded-full bg-[#15945b]/10 blur-[95px]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[12%] top-20 h-64 w-64 rounded-full bg-sky-200/25 blur-[100px] dark:bg-sky-500/10" aria-hidden="true" />
      <div className="relative mx-auto max-w-[820px]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">{eyebrow}</p>
        <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-[#0b1f33] dark:text-white sm:text-5xl lg:text-[60px]">{title}</h1>
        <p className="mt-6 text-base leading-8 text-[#566473] dark:text-slate-300 sm:text-lg lg:text-xl">{description}</p>
      </div>
    </header>
  )
}
