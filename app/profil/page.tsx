"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { roleDisplayNames } from "@/lib/auth-context"
import type { AccountProfile } from "@/lib/account-profile"
import type { AppRole } from "@/types/auth"

export default function ProfilPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [error, setError] = useState("")
  useEffect(() => { void fetch("/api/account/profile", { cache: "no-store" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setProfile(data.profile) }).catch((cause) => setError(cause instanceof Error ? cause.message : "Profil belum dapat dimuat.")) }, [])
  const initials = profile?.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "PI"

  return <div className="flex min-h-screen flex-col bg-background"><Navbar /><main className="container mx-auto max-w-4xl flex-1 space-y-6 px-4 py-8">
    <header><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">AKUN PIINDUNG</p><h1 className="mt-2 text-3xl font-bold">Profil Saya</h1><p className="mt-2 text-muted-foreground">Informasi akun pusat yang tersimpan aman di PIINDUNG.</p></header>
    {error && <div role="alert" className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</div>}
    {!profile && !error && <div className="rounded-2xl border p-10 text-center text-muted-foreground">Memuat profil...</div>}
    {profile && <>
      <Card><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center"><Avatar className="h-24 w-24"><AvatarImage src={profile.avatar ?? undefined} alt={profile.name} /><AvatarFallback className="text-2xl">{initials}</AvatarFallback></Avatar><div className="flex-1"><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-bold">{profile.name}</h2><Badge variant="secondary">{profile.status}</Badge></div><p className="mt-1 text-muted-foreground">{roleDisplayNames[profile.role as AppRole] ?? profile.role}</p><p className="mt-3 font-mono text-sm">{profile.memberId}</p></div><Button asChild><Link href="/pengaturan-profil">Pengaturan Akun</Link></Button></CardContent></Card>
      <Card><CardHeader><CardTitle>Informasi Profil</CardTitle></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Nama</dt><dd className="font-medium">{profile.name}</dd></div><div><dt className="text-sm text-muted-foreground">Member ID</dt><dd className="font-mono font-medium">{profile.memberId}</dd></div><div><dt className="text-sm text-muted-foreground">Email</dt><dd className="font-medium">{profile.email || "Belum diatur"}</dd></div><div><dt className="text-sm text-muted-foreground">Nomor HP</dt><dd className="font-medium">{profile.phone}</dd></div><div><dt className="text-sm text-muted-foreground">Peran</dt><dd className="font-medium">{roleDisplayNames[profile.role as AppRole] ?? profile.role}</dd></div><div><dt className="text-sm text-muted-foreground">Status akun</dt><dd className="font-medium">{profile.status}</dd></div></dl></CardContent></Card>
      <div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link href="/member-area/identitas">Kartu Identitas Digital</Link></Button><Button asChild variant="outline"><Link href={profile.verificationUrl} target="_blank">Verifikasi Identitas</Link></Button></div>
    </>}
  </main><SimpleFooter /></div>
}
