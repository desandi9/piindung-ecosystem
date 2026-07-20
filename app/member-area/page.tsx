"use client"

import Link from "next/link"
import { CircleHelp, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MemberLayout } from "@/components/member-area/member-shell"
import { useAuth } from "@/lib/auth-context"

type PortalModule = { key: string; name: string; route: string; description: string }
type PortalAccess = { permissions: string[]; modules: PortalModule[] }

function PortalCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ElementType
}) {
  return (
    <Link
      href={href}
      className="flex min-h-36 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
      <h3 className="mt-5 font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  )
}

export default function MemberAreaPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [portalAccess, setPortalAccess] = useState<PortalAccess>({ permissions: [], modules: [] })

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?next=/member-area")
    }
  }, [isLoading, router, user])

  useEffect(() => {
    if (!user) return
    void fetch("/api/portal-access/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { permissions: [], modules: [] }))
      .then((data: PortalAccess) => setPortalAccess(data))
  }, [user])

  if (isLoading || !user) {
    return <div className="min-h-screen bg-background" />
  }

  const modules = portalAccess.modules
  const canManage = portalAccess.permissions.includes("users.manage") || portalAccess.permissions.includes("homepage.manage")
  const canManageAccess = portalAccess.permissions.includes("access.manage")
  const canManageContent = portalAccess.permissions.includes("articles.manage") || portalAccess.permissions.includes("homepage.manage")

  return (
    <MemberLayout title="Member Area" breadcrumb="Portal PIINDUNG / Member Area">
      <div className="mx-auto max-w-6xl space-y-8 overflow-x-hidden">
        <section
          className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          aria-labelledby="member-heading"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            MEMBER AREA
          </p>
          <h1
            id="member-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-foreground"
          >
            Ruang akun {user.name}
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Buka modul yang tersedia atau kelola bagian PIINDUNG sesuai izin akun Anda.
          </p>
        </section>

        <section aria-labelledby="modules-heading">
          <h2 id="modules-heading" className="text-xl font-bold text-foreground">
            Modul Saya
          </h2>
          {modules.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {modules.map((module) => (
                <PortalCard
                  key={module.key}
                  title={module.name}
                  description={module.description}
                  href={module.route}
                  icon={Settings}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
              Belum ada modul yang tersedia untuk akun Anda.
            </p>
          )}
        </section>

        <section aria-labelledby="management-heading">
          <h2 id="management-heading" className="text-xl font-bold text-foreground">
            Pengelolaan PIINDUNG
          </h2>
          {canManage || canManageAccess ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {portalAccess.permissions.includes("users.manage") && (
                <PortalCard
                  title="Pengguna"
                  description="Kelola akun pengguna dan unit organisasi."
                  href="/member-area/pengguna"
                  icon={Settings}
                />
              )}
              {canManageAccess && (
                <PortalCard
                  title="Hak Akses"
                  description="Kelola hak akses modul pengguna dan kapasitas peran."
                  href="/member-area/hak-akses"
                  icon={Settings}
                />
              )}
              {canManageContent && (
                <PortalCard
                  title="Konten PIINDUNG"
                  description="Buka pusat pengelolaan konten publik PIINDUNG."
                  href="/member-area/konten"
                  icon={Settings}
                />
              )}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
              Akun Anda tidak memiliki alat pengelolaan PIINDUNG. Akses modul tetap
              tersedia melalui bagian Modul Saya.
            </p>
          )}
        </section>

        <section aria-labelledby="account-heading">
          <h2 id="account-heading" className="text-xl font-bold text-foreground">
            Akun dan Profil
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PortalCard
              title="Identitas Anggota"
              description="Lihat kartu identitas digital dan kode QR resmi Anda."
              href="/member-area/identitas"
              icon={User}
            />
            <PortalCard
              title="Profil"
              description="Lihat identitas, status, dan informasi akun Anda."
              href="/profil"
              icon={User}
            />
            <PortalCard
              title="Pengaturan Profil"
              description="Perbarui preferensi dan keamanan profil Anda."
              href="/pengaturan-profil"
              icon={Settings}
            />
          </div>
        </section>

        <section aria-labelledby="help-heading">
          <h2 id="help-heading" className="text-xl font-bold text-foreground">
            Bantuan
          </h2>
          <div className="mt-4">
            <PortalCard
              title="Pusat Bantuan"
              description="Temukan panduan dan kontak dukungan resmi PIINDUNG."
              href="/bantuan"
              icon={CircleHelp}
            />
          </div>
        </section>
      </div>
    </MemberLayout>
  )
}
