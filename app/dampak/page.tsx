import type { Metadata } from "next"
import { PublicPageShell } from "@/components/piindung/public-page-shell"
import { ImpactHero } from "@/components/piindung/impact/impact-hero"
import { ImpactStats } from "@/components/piindung/impact/impact-stats"
import { ImpactCaseStudies } from "@/components/piindung/impact/impact-case-studies"
import { ImpactHighlights } from "@/components/piindung/impact/impact-highlights"
import { ImpactTestimonials } from "@/components/piindung/impact/impact-testimonials"
import { ImpactCta } from "@/components/piindung/impact/impact-cta"
import { readImpactContent } from "@/lib/impact-content-server"
import { toPublicImpactContent } from "@/lib/impact-content"

export const metadata: Metadata = {
  title: "Dampak | PIINDUNG",
  description: "Dampak nyata digitalisasi pelayanan ZIS melalui ekosistem PIINDUNG NU Care–LAZISNU Garut.",
}

export default async function ImpactPage() {
  const raw = await readImpactContent()
  const content = toPublicImpactContent(raw)

  return (
    <PublicPageShell>
      <ImpactHero />
      <ImpactStats content={content.impactStats} />
      <ImpactCaseStudies content={content.caseStudies} />
      <ImpactHighlights />
      <ImpactTestimonials content={content.testimonials} />
      <ImpactCta />
    </PublicPageShell>
  )
}
