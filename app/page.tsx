import { ArticlePreview } from "@/components/piindung/article-preview"
import { HelpCenterPreview } from "@/components/piindung/help-center-preview"
import { HowItWorks } from "@/components/piindung/how-it-works"
import { ImpactPreview } from "@/components/piindung/impact-preview"
import { MediaArticles } from "@/components/piindung/media-articles"
import { PublicFooter } from "@/components/piindung/public-footer"
import { HeroSection } from "@/components/piindung/public-hero"
import { LandingIntro } from "@/components/piindung/landing-intro"
import { LandingScrollProgress } from "@/components/piindung/landing-scroll-progress"
import { PublicNavbar } from "@/components/piindung/public-navbar"
import { PublicProducts } from "@/components/piindung/public-products"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"

export default function Home() {
  return (
    <div className="landing-shell bg-[#f7faf8] dark:bg-[#07131f]">
      <main className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-slate-950 dark:bg-[#07131f] dark:text-white">
        <PublicThemeDefault />
        <LandingScrollProgress />
        <PublicNavbar />
        <HeroSection />
        <LandingIntro />

        <PublicProducts />
        <HowItWorks />
        <ImpactPreview />
        <ArticlePreview />
        <MediaArticles />
        <HelpCenterPreview />
      </main>
      <PublicFooter />
    </div>
  )
}
