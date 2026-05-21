"use client"

import Link from "next/link"
import { FileBarChart, ClipboardList, CalendarDays, Camera, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { reportPages, type ReportIconKey } from "./report-data"

function iconFor(icon: ReportIconKey) {
  if (icon === "program") return FileBarChart
  if (icon === "kegiatan") return ClipboardList
  if (icon === "tahunan") return CalendarDays
  return Camera
}

export default function LaporanPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-6 lg:px-8">
        {/* Back button */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground">
            Laporan NU Care-LAZISNU Garut
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Akses laporan program, kegiatan, dan dokumentasi
          </p>
        </div>
        
        {/* Laporan Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {reportPages.map((item) => {
            const Icon = iconFor(item.icon)

            return (
            <Link
              key={item.title}
              href={`/laporan/${item.slug}`}
              className={cn(
                "flex flex-col p-4 lg:p-5 bg-card rounded-xl border border-border",
                "hover:border-[#2e8b57]/30 hover:shadow-md transition-all duration-300 group"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center",
                  "group-hover:bg-[#2e8b57]/20 transition-colors"
                )}>
                  <Icon className="h-5 w-5 text-[#2e8b57]" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.shortDescription}</p>
            </Link>
          )})}
        </div>
      </main>
      <SimpleFooter />
    </div>
  )
}
