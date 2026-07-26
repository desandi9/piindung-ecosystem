import { Poppins } from "next/font/google"
import { PublicFooter } from "@/components/piindung/public-footer"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return <div className={poppins.className}><main className="min-h-screen overflow-x-hidden bg-[#f8fbf9] text-slate-950 dark:bg-[#07131f] dark:text-white"><PublicThemeDefault /><PublicNavbar />{children}</main><PublicFooter /></div>
}

export function PublicPageHeader({ eyebrow, title, description, index }: { eyebrow: string; title: React.ReactNode; description: string; index?: string }) {
  return (
    <header className="relative overflow-hidden px-5 pb-16 pt-36 sm:px-8 sm:pb-20 sm:pt-40 lg:pb-24 lg:pt-44">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(8,33,59,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(8,33,59,.035)_1px,transparent_1px)] [background-size:56px_56px] dark:opacity-20" />
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-emerald-200/25 blur-[110px]" />
      <div className="relative mx-auto max-w-[1040px]">
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-[760px]"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">{eyebrow}</p><h1 className="mt-5 text-[clamp(3rem,6vw,5.2rem)] font-bold leading-[.94] tracking-[-.065em] text-[#08213b] dark:text-white">{title}</h1><p className="mt-7 max-w-[680px] text-base leading-8 text-[#6c7a89] dark:text-slate-300 sm:text-lg">{description}</p></div>
          {index && <span className="hidden text-[92px] font-bold leading-none tracking-[-.08em] text-[#08213b]/[.05] sm:block dark:text-white/[.05]">{index}</span>}
        </div>
      </div>
    </header>
  )
}
