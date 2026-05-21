import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CalendarDays, Camera, ClipboardList, ExternalLink, FileBarChart } from "lucide-react"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { reportPages, getReportPage, type ReportIconKey } from "../report-data"

function iconFor(icon: ReportIconKey) {
  if (icon === "program") return FileBarChart
  if (icon === "kegiatan") return ClipboardList
  if (icon === "tahunan") return CalendarDays
  return Camera
}

export default async function LaporanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const report = getReportPage(slug)

  if (!report) notFound()

  const HeroIcon = iconFor(report.icon)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <Link href="/laporan" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Halaman Laporan
        </Link>

        <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card/80 shadow-[0_18px_48px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="bg-gradient-to-r from-[#2e8b57]/10 to-transparent p-5 lg:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2e8b57]/10 text-[#2e8b57]">
                <HeroIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2e8b57]">Laporan Publik</p>
                <h1 className="mt-2 text-2xl font-semibold text-foreground lg:text-3xl">{report.title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{report.heroDescription}</p>
                <p className="mt-3 text-xs text-muted-foreground">Terakhir diperbarui: {report.updatedAt}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {report.metrics.map((metric) => (
            <Card key={metric.label} className="border-border/70 shadow-sm">
              <CardContent className="p-4 lg:p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {report.sections.map((section) => (
            <Card key={section.title} className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Navigasi Laporan Lain</CardTitle>
            <CardDescription>Pilih jenis laporan lain untuk melanjutkan peninjauan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {reportPages.filter((item) => item.slug !== report.slug).map((item) => {
                const Icon = iconFor(item.icon)
                return (
                  <Link key={item.slug} href={`/laporan/${item.slug}`} className="group rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:border-[#2e8b57]/30 hover:shadow-md">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2e8b57]/10 text-[#2e8b57]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.shortDescription}</p>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
      <SimpleFooter />
    </div>
  )
}
