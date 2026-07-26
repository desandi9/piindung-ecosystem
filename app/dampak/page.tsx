import type { Metadata } from "next"
import { PublicPageShell } from "@/components/piindung/public-page-shell"
import { ImpactHero } from "@/components/piindung/impact/impact-hero"
import { ImpactStats } from "@/components/piindung/impact/impact-stats"
import { ImpactCaseStudies } from "@/components/piindung/impact/impact-case-studies"
import { ImpactHighlights } from "@/components/piindung/impact/impact-highlights"
import { ImpactTestimonials } from "@/components/piindung/impact/impact-testimonials"
import { ImpactCta } from "@/components/piindung/impact/impact-cta"

export const metadata: Metadata = {
  title: "Dampak | PIINDUNG",
  description: "Dampak nyata digitalisasi pelayanan ZIS melalui ekosistem PIINDUNG NU Care–LAZISNU Garut.",
}

export default function ImpactPage() {
  return (
    <PublicPageShell>
      <ImpactHero />
      <ImpactStats />
      <ImpactCaseStudies />
      <ImpactHighlights />
      <ImpactTestimonials />
      <ImpactCta />
    </PublicPageShell>
  )
}
