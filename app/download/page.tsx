"use client"

import Link from "next/link"
import {
  Archive,
  ArrowLeft,
  Download,
  FileArchive,
  FileImage,
  FileText,
} from "lucide-react"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { Navbar } from "@/components/piindung/navbar"
import { categoryLabel, useDownloadItems, type DownloadCategory } from "@/lib/download-center"
import { cn } from "@/lib/utils"

function categoryIcon(category: DownloadCategory) {
  if (category === "logo") return FileImage
  if (category === "media asset") return FileArchive
  return FileText
}

export default function DownloadPage() {
  const downloadItems = useDownloadItems()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 lg:px-8 py-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground">
            Download Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unduh logo, template berkas, dokumen, dan media assets resmi
          </p>
        </div>

        <div className="grid gap-3 lg:gap-4 md:grid-cols-2">
          {downloadItems.map((item) => {
            const Icon = categoryIcon(item.category)

            return (
            <div
              key={item.id}
              className={cn(
                "group flex flex-col bg-card rounded-xl border border-border overflow-hidden",
                "hover:border-[#2e8b57]/30 hover:shadow-md transition-all duration-300"
              )}
            >
              <div className="p-4 lg:p-5 border-b border-border bg-gradient-to-r from-[#2e8b57]/10 to-[#2e8b57]/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center group-hover:bg-[#2e8b57]/20 transition-colors">
                    <Icon className="h-5 w-5 text-[#2e8b57]" />
                  </div>
                  <span className="rounded-full bg-[#2e8b57]/10 px-2.5 py-1 text-xs font-medium text-[#2e8b57]">
                    {categoryLabel(item.category)}
                  </span>
                </div>
              </div>
              <div className="p-4 lg:p-5 flex flex-1 flex-col">
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.name}</h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
                <div className="mt-auto flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <Archive className="h-4 w-4 text-[#2e8b57] shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{item.fileName}</span>
                </div>
                <a
                  href={item.link}
                  download={item.fileName}
                  className={cn(
                    "mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl",
                    "bg-[#2e8b57] hover:bg-[#236b43] text-white font-medium text-sm",
                    "transition-all duration-200 hover:shadow-lg hover:shadow-[#2e8b57]/20"
                  )}
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </div>
            )
          })}
        </div>
      </main>
      <SimpleFooter />
    </div>
  )
}
