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
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"

const programItems = [
  {
    icon: Info,
    title: "Profil NU Care-LAZISNU Garut",
    description: "Informasi lengkap tentang lembaga",
    href: "/program/profil",
    color: "text-[#2e8b57]",
  },
  {
    icon: Building2,
    title: "Program Kelembagaan",
    description: "Penguatan kapasitas kelembagaan NU",
    href: "/program/kelembagaan",
    color: "text-[#2e8b57]",
  },
  {
    icon: Users,
    title: "Program Sosial",
    description: "Bantuan sosial untuk masyarakat",
    href: "/program/sosial",
    color: "text-[#2e8b57]",
  },
  {
    icon: Heart,
    title: "NU Care Berdaya",
    description: "Pemberdayaan ekonomi umat",
    href: "/program/berdaya",
    color: "text-[#2e8b57]",
  },
  {
    icon: GraduationCap,
    title: "NU Care Cerdas",
    description: "Pendidikan dan beasiswa",
    href: "/program/cerdas",
    color: "text-[#2e8b57]",
  },
  {
    icon: Handshake,
    title: "NU Care Damai",
    description: "Harmoni dan kerukunan umat",
    href: "/program/damai",
    color: "text-[#2e8b57]",
  },
  {
    icon: Leaf,
    title: "NU Care Hijau",
    description: "Pelestarian lingkungan hidup",
    href: "/program/hijau",
    color: "text-[#2e8b57]",
  },
  {
    icon: Stethoscope,
    title: "NU Care Sehat",
    description: "Layanan kesehatan masyarakat",
    href: "/program/sehat",
    color: "text-[#2e8b57]",
  },
  {
    icon: AlertTriangle,
    title: "Program Kebencanaan",
    description: "Tanggap darurat dan pemulihan",
    href: "/program/kebencanaan",
    color: "text-[#2e8b57]",
  },
]

export function ProgramSection() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Program NU Care-LAZISNU Garut
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {programItems.map((item) => (
          <ProgramCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  )
}

function ProgramCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: typeof Building2
  title: string
  description: string
  href: string
  color: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col p-4 lg:p-5 bg-card rounded-xl border border-border",
        "hover:border-[#2e8b57]/30 hover:shadow-md transition-all duration-300 group"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center mb-3",
        "group-hover:bg-[#2e8b57]/20 transition-colors"
      )}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    </Link>
  )
}
