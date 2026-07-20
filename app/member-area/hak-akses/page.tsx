"use client"

import { useEffect, useState } from "react"
import { ShieldAlert, Loader2 } from "lucide-react"
import { MemberLayout } from "@/components/member-area/member-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type AccessUser = { id: string; name: string; role: string; status: string; modules: Array<{ key: string; name: string }> }

export default function HakAksesPage() {
  const { user, isLoading } = useAuth()
  const [users, setUsers] = useState<AccessUser[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmTarget, setConfirmTarget] = useState<{ userId: string; name: string } | null>(null)

  useEffect(() => {
    if (!isLoading && user?.role === "super_admin_pc") {
      void fetch("/api/portal-access/grants")
        .then((res) => (res.ok ? res.json() : { users: [] }))
        .then((data: { users?: AccessUser[] }) => {
          if (data.users) setUsers(data.users)
          setLoading(false)
        })
    }
  }, [user, isLoading])

  const toggleGrant = async (userId: string, moduleKey: string, enabled: boolean) => {
    const backup = [...users]
    setUsers((current) =>
      current.map((u) =>
        u.id === userId
          ? {
              ...u,
              modules: enabled
                ? [...u.modules, { key: moduleKey, name: "GORUT" }]
                : u.modules.filter((m) => m.key !== moduleKey),
            }
          : u
      )
    )
    try {
      const res = await fetch("/api/portal-access/grants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, moduleKey, enabled }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setUsers(backup)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || user.role !== "super_admin_pc") {
    return (
      <MemberLayout title="Akses Ditolak" breadcrumb="Member Area / Hak Akses">
        <Card className="mx-auto max-w-md border-border shadow-md">
          <CardHeader className="text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">Akses Ditolak</CardTitle>
            <CardDescription>Halaman ini hanya dapat diakses oleh akun Super Admin PC.</CardDescription>
          </CardHeader>
        </Card>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout title="Hak Akses" breadcrumb="Member Area / Hak Akses">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Hak Akses PIINDUNG</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kelola izin masuk modul pengguna dan tinjau kapasitas peran.
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Kapasitas Peran (Read-Only)</CardTitle>
            <CardDescription>
              PIINDUNG menetapkan izin bawaan yang tidak dapat diubah di tingkat operasional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="font-semibold text-foreground">Super Admin PC</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Akses penuh PIINDUNG, manajemen pengguna, manajemen semua konten, pengaturan,
                  audit, dan akses sistem ke semua modul.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="font-semibold text-foreground">Admin PC</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Akses dashboard, pengelolaan artikel dan berita PIINDUNG, dan operasi GORUT.
                  Tidak memiliki manajemen pengguna.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Akses Modul Pengguna</CardTitle>
            <CardDescription>
              Berikan izin masuk portal ke modul operasional. Izin operasi spesifik tetap
              dikelola di dalam modul masing-masing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Memuat data pengguna...
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((u) => {
                  const hasGorut = u.modules.some((m) => m.key === "gorut")
                  return (
                    <div
                      key={u.id}
                      className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{u.name}</p>
                          {u.status !== "Aktif" && (
                            <Badge variant="secondary" className="text-xs">
                              Tidak Aktif
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{u.role}</p>
                      </div>
                      {u.role !== "super_admin_pc" ? (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground">Akses GORUT</span>
                          <Switch
                            checked={hasGorut}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                setConfirmTarget({ userId: u.id, name: u.name })
                              } else {
                                void toggleGrant(u.id, "gorut", true)
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                          Akses Sistem Bawaan
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl border-border bg-card shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cabut Akses GORUT</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mencabut izin masuk modul GORUT untuk pengguna{" "}
              <span className="font-semibold text-foreground">{confirmTarget?.name}</span>?
              Tindakan ini akan mencegah pengguna mengakses area kerja GORUT.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmTarget) {
                  void toggleGrant(confirmTarget.userId, "gorut", false)
                  setConfirmTarget(null)
                }
              }}
            >
              Cabut Izin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MemberLayout>
  )
}
