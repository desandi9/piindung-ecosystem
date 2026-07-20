"use client"

import Link from "next/link"
import { CircleHelp, ExternalLink, ShieldCheck } from "lucide-react"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { useEffect, useState } from "react"
import { roleDisplayNames, useAuth } from "@/lib/auth-context"
import { getPublishedNotifications, useNotifications } from "@/lib/notifications"

type PortalModule = { key: string; name: string; route: string; description: string }

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      aria-labelledby={id}
    >
      <h2 id={id} className="text-xl font-bold text-foreground">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const notifications = getPublishedNotifications(useNotifications()).slice(0, 3)
  const [modules, setModules] = useState<PortalModule[]>([])

  useEffect(() => {
    if (!user) return
    void fetch("/api/portal-access/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { modules: [] }))
      .then((data: { modules?: PortalModule[] }) => setModules(data.modules ?? []))
  }, [user])

  if (isLoading || !user) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main
        className="container mx-auto flex-1 space-y-6 px-4 py-8 lg:max-w-6xl lg:px-8"
        aria-label="Konten utama dashboard PIINDUNG"
      >
        <section
          className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          aria-labelledby="account-summary-heading"
        >
          <p className="text-sm font-semibold text-primary">PORTAL PIINDUNG</p>
          <h1
            id="account-summary-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-foreground"
          >
            Selamat datang, {user.name}
          </h1>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Peran organisasi</dt>
              <dd className="mt-1 font-semibold text-foreground">
                {roleDisplayNames[user.role]}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status akun</dt>
              <dd className="mt-1 inline-flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                Aktif (sesi terverifikasi)
              </dd>
            </div>
          </dl>
        </section>

        <Section id="available-modules-heading" title="Modul Tersedia">
          {modules.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {modules.map((module) => (
                <article key={module.key} className="rounded-xl border border-border p-5">
                  <p className="text-sm font-semibold text-primary">Tersedia</p>
                  <h3 className="mt-2 text-lg font-bold text-foreground">{module.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {module.description}
                  </p>
                  <Link
                    href={module.route}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    Masuk modul
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
              Belum ada modul yang tersedia untuk akun Anda.
            </p>
          )}
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section id="notifications-heading" title="Notifikasi">
            <div className="space-y-3">
              {notifications.length ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold text-foreground">{notification.title}</h3>
                      {notification.unread ? (
                        <span className="shrink-0 text-xs font-semibold text-primary">
                          Belum dibaca
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada notifikasi umum.</p>
              )}
              <Link
                href="/notifikasi"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-primary"
              >
                Lihat semua notifikasi
              </Link>
            </div>
          </Section>

          <Section id="recent-activity-heading" title="Aktivitas Akun Terbaru">
            <p className="text-sm text-muted-foreground">
              Belum ada aktivitas akun yang dapat ditampilkan.
            </p>
          </Section>
        </div>

        <Section id="help-shortcut-heading" title="Butuh Bantuan?">
          <p className="text-sm leading-6 text-muted-foreground">
            Temukan panduan dan kontak dukungan resmi PIINDUNG di Pusat Bantuan.
          </p>
          <Link
            href="/bantuan"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            Buka Bantuan
          </Link>
        </Section>
      </main>
      <SimpleFooter />
    </div>
  )
}
