"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Copy, ExternalLink, Printer, ShieldCheck } from "lucide-react"
import { MemberLayout } from "@/components/member-area/member-shell"

type Identity = { memberId: string; name: string; role: string; status: string; avatar: string | null; organization: string; verificationUrl: string; qrUrl: string }

export default function MemberIdentityPage() {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [error, setError] = useState("")
  useEffect(() => { void fetch("/api/member-identity/me", { cache: "no-store" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setIdentity(data) }).catch((cause) => setError(cause instanceof Error ? cause.message : "Identitas belum dapat dimuat.")) }, [])
  const copy = (value: string) => void navigator.clipboard.writeText(value)

  return <MemberLayout title="Identitas Anggota" breadcrumb="Member Area / Identitas Anggota">
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-none">
      <header className="print:hidden"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">IDENTITAS ANGGOTA</p><h1 className="mt-2 text-3xl font-bold">Kartu Identitas Digital</h1><p className="mt-2 text-muted-foreground">Identitas pusat akun PIINDUNG Anda.</p></header>
      {error && <div role="alert" className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</div>}
      {!identity && !error && <div className="rounded-2xl border p-10 text-center text-muted-foreground">Memuat identitas...</div>}
      {identity && <>
        <section className="overflow-hidden rounded-[28px] border bg-card shadow-xl print:shadow-none" aria-label="Kartu identitas PIINDUNG">
          <div className="bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] p-6 text-white sm:p-8"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold tracking-[.18em]">PIINDUNG</p><p className="mt-1 text-sm text-white/70">{identity.organization}</p></div><ShieldCheck className="h-10 w-10" /></div></div>
          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_240px] md:items-center"><div><p className="text-sm text-muted-foreground">Nama Anggota</p><h2 className="mt-1 text-2xl font-bold">{identity.name}</h2><dl className="mt-6 space-y-4"><div><dt className="text-xs text-muted-foreground">Member ID</dt><dd className="mt-1 font-mono text-lg font-bold tracking-wider">{identity.memberId}</dd></div><div><dt className="text-xs text-muted-foreground">Peran PIINDUNG</dt><dd className="mt-1 font-semibold">{identity.role}</dd></div><div><dt className="text-xs text-muted-foreground">Status Akun</dt><dd className="mt-1 font-semibold text-emerald-600">{identity.status}</dd></div></dl></div><div className="flex justify-center"><img src={identity.qrUrl} alt={`QR verifikasi untuk ${identity.memberId}`} width={240} height={240} className="rounded-2xl bg-white p-3" /></div></div>
        </section>
        <p className="rounded-xl border bg-muted/30 p-4 text-sm leading-6"><strong>Perhatian:</strong> QR ini digunakan untuk memeriksa keabsahan identitas anggota. QR bukan token login dan tidak memberikan akses ke modul operasional.</p>
        <div className="grid gap-3 print:hidden sm:grid-cols-2 lg:grid-cols-4"><button onClick={() => copy(identity.memberId)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border font-semibold"><Copy className="h-4 w-4" /> Salin Member ID</button><button onClick={() => copy(identity.verificationUrl)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border font-semibold"><Copy className="h-4 w-4" /> Salin Tautan</button><Link href={identity.verificationUrl} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border font-semibold"><ExternalLink className="h-4 w-4" /> Verifikasi Publik</Link><button onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"><Printer className="h-4 w-4" /> Cetak</button></div>
      </>}
    </div>
  </MemberLayout>
}
