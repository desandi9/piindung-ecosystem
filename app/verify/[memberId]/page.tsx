import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BadgeCheck, Building2, Shield, User, ArrowLeft } from "lucide-react"
import { findPublicMember } from "@/lib/member-identity-server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
  title: "Verifikasi Identitas PIINDUNG",
  description: "Verifikasi identitas anggota PIINDUNG.",
  robots: { index: false, follow: false },
}

export default async function VerifyPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params
  const member = await findPublicMember(memberId)
  if (!member) notFound()
  const active = member.status.active

  return <main className="min-h-screen bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] p-4 sm:p-8">
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
      <Card className="w-full overflow-hidden border-0 shadow-2xl">
        <div className={active ? "bg-emerald-600 p-5 text-center text-white" : "bg-slate-700 p-5 text-center text-white"}>
          <div className="flex items-center justify-center gap-2"><BadgeCheck className="h-5 w-5" /><span className="font-semibold">{active ? "IDENTITAS TERDAFTAR" : "IDENTITAS TERDAFTAR"}</span></div>
        </div>
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f3460] text-xl font-bold text-white">P</div><p className="mt-3 text-lg font-bold">PIINDUNG</p></div>
          <div className="text-center"><h1 className="text-2xl font-bold">{member.name}</h1><p className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"><Shield className="h-3.5 w-3.5" /> {member.role}</p></div>
          <div className="rounded-xl border bg-muted/40 p-4 text-center"><p className="font-semibold">{member.status.label}</p><p className="mt-1 text-sm text-muted-foreground">{member.status.result}</p></div>
          <div className="space-y-3"><Detail icon={User} label="Member ID" value={member.memberId} /><Detail icon={Building2} label="Organisasi" value={member.organization} /><Detail icon={Shield} label="Status" value={member.status.label} /></div>
          <p className="border-t pt-4 text-center text-xs text-muted-foreground">Pemeriksaan dilakukan pada {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date())}. Halaman ini tidak menyatakan sertifikasi pemerintah atau legalitas identitas.</p>
          <Button variant="outline" size="sm" asChild className="w-full"><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda</Link></Button>
        </CardContent>
      </Card>
    </div>
  </main>
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"><Icon className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="truncate text-sm font-medium">{value}</p></div></div> }
