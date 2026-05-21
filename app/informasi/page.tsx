"use client"

import Link from "next/link"
import { 
  Newspaper,
  FileText,
  Info,
  Megaphone,
  ArrowLeft,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"

const informasiItems = [
  {
    icon: Newspaper,
    title: "Berita",
    description: "Berita terbaru seputar kegiatan NU Care-LAZISNU Garut",
    href: "https://nucare.id/category/berita",
  },
  {
    icon: FileText,
    title: "Artikel",
    description: "Artikel dan tulisan inspiratif dari NU Care-LAZISNU",
    href: "https://nucare.id/category/artikel",
  },
  {
    icon: Info,
    title: "Informasi",
    description: "Informasi umum dan pengumuman resmi lembaga",
    href: "https://nucare.id/category/informasi",
  },
  {
    icon: Megaphone,
    title: "Pengumuman",
    description: "Pengumuman penting dari NU Care-LAZISNU Garut",
    href: "https://nucare.id/category/pengumuman",
  },
]

export default function InformasiPage() {
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
            Informasi NU Care-LAZISNU Garut
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Akses berita, artikel, dan informasi terbaru
          </p>
        </div>
        
        {/* Informasi Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {informasiItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
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
                  <item.icon className="h-5 w-5 text-[#2e8b57]" />
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            </a>
          ))}
        </div>
      </main>
      <SimpleFooter />
    </div>
  )
}
