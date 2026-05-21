"use client"

import Link from "next/link"
import { 
  Building2,
  Users,
  Heart,
  GraduationCap,
  Handshake,
  Leaf,
  Stethoscope,
  AlertTriangle,
  Info,
  ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"

const programItems = [
  {
    icon: Info,
    title: "Profil NU Care-LAZISNU Garut",
    description: "Informasi lengkap tentang lembaga",
    href: "/program/profil",
  },
  {
    icon: Building2,
    title: "Program Kelembagaan",
    description: "Penguatan kapasitas kelembagaan NU",
    href: "/program/kelembagaan",
  },
  {
    icon: Users,
    title: "Program Sosial",
    description: "Bantuan sosial untuk masyarakat",
    href: "/program/sosial",
  },
  {
    icon: Heart,
    title: "NU Care Berdaya",
    description: "Pemberdayaan ekonomi umat",
    href: "/program/berdaya",
  },
  {
    icon: GraduationCap,
    title: "NU Care Cerdas",
    description: "Pendidikan dan beasiswa",
    href: "/program/cerdas",
  },
  {
    icon: Handshake,
    title: "NU Care Damai",
    description: "Harmoni dan kerukunan umat",
    href: "/program/damai",
  },
  {
    icon: Leaf,
    title: "NU Care Hijau",
    description: "Pelestarian lingkungan hidup",
    href: "/program/hijau",
  },
  {
    icon: Stethoscope,
    title: "NU Care Sehat",
    description: "Layanan kesehatan masyarakat",
    href: "/program/sehat",
  },
  {
    icon: AlertTriangle,
    title: "Program Kebencanaan",
    description: "Tanggap darurat dan pemulihan",
    href: "/program/kebencanaan",
  },
]

export default function ProgramPage() {
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
            Program NU Care-LAZISNU Garut
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pilih program untuk melihat informasi lebih lanjut
          </p>
        </div>
        
        {/* Program Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {programItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex flex-col p-4 lg:p-5 bg-card rounded-xl border border-border",
                "hover:border-[#2e8b57]/30 hover:shadow-md transition-all duration-300 group"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center mb-3",
                "group-hover:bg-[#2e8b57]/20 transition-colors"
              )}>
                <item.icon className="h-5 w-5 text-[#2e8b57]" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            </Link>
          ))}
        </div>
      </main>
      <SimpleFooter />
    </div>
  )
}
