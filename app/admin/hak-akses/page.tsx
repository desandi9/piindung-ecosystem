"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  RotateCcw,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { addActivityLog } from "@/lib/activity-log"
import { useAuth } from "@/lib/auth-context"
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  type ManagedAdminRole,
  type PermissionGroup,
  type PermissionId,
  updateRolePermission,
  useRolePermissions,
  writeRolePermissions,
} from "@/lib/access-permissions"

const managedRoles: Array<{ id: ManagedAdminRole; label: string; description: string }> = [
  {
    id: "super_admin_pc",
    label: "Super Admin PC",
    description: "Akses administrator pusat penuh untuk PIINDUNG.",
  },
  {
    id: "admin_pc",
    label: "Admin PC",
    description: "Akses operasional admin PC untuk konten dan monitoring.",
  },
]

function groupIcon(groupId: string) {
  if (groupId === "dashboard") return LayoutDashboard
  if (groupId === "content") return FileText
  if (groupId === "system") return Settings
  return UserCog
}

export default function HakAksesPage() {
  const permissions = useRolePermissions()
  const { user } = useAuth()
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  function handleToggle(role: ManagedAdminRole, permissionId: PermissionId, enabled: boolean, label: string) {
    updateRolePermission(role, permissionId, enabled)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Permission",
      action: `${enabled ? "Mengaktifkan" : "Menonaktifkan"} akses ${label} untuk ${role === "super_admin_pc" ? "Super Admin PC" : "Admin PC"}`,
      status: "Success",
    })
  }

  function resetPermissions() {
    writeRolePermissions(DEFAULT_ROLE_PERMISSIONS)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Permission",
      action: "Reset Hak Akses ke default",
      status: "Warning",
    })
    setConfirmResetOpen(false)
  }

  const enabledCount = managedRoles.reduce((total, role) => {
    return total + Object.values(permissions[role.id]).filter(Boolean).length
  }, 0)

  const totalPermissionToggles = PERMISSION_GROUPS.reduce((total, group) => total + group.permissions.length, 0) * managedRoles.length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Shield className="h-4 w-4 text-primary" />
              PIINDUNG Admin Permissions
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Hak Akses</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola akses Super Admin PC dan Admin PC untuk dashboard, artikel/banner, pengaturan, dan menu sistem.
            </p>
          </div>
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setConfirmResetOpen(true)}>
            <RotateCcw className="h-4 w-4" />
            Reset Default
          </Button>
        </div>

        <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
          <AlertDialogContent className="rounded-2xl border-border bg-card shadow-xl">
            <AlertDialogHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <AlertDialogTitle>Reset Hak Akses</AlertDialogTitle>
              <AlertDialogDescription>
                Seluruh konfigurasi hak akses untuk Super Admin PC dan Admin PC akan dikembalikan ke pengaturan default. Pastikan perubahan manual yang sudah disesuaikan memang ingin dihapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
              <AlertDialogAction className="rounded-xl bg-primary hover:bg-primary/90" onClick={resetPermissions}>
                Reset Sekarang
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard icon={ShieldCheck} title="Role Dikelola" value="2" />
          <SummaryCard icon={CheckCircle2} title="Akses Aktif" value={String(enabledCount)} />
          <SummaryCard icon={LockKeyhole} title="Perubahan" value="Instant" />
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Ringkasan Konfigurasi</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {enabledCount} dari {totalPermissionToggles} kombinasi akses sedang aktif untuk role admin yang dikelola.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {managedRoles.map((role) => {
                  const activePermissions = Object.values(permissions[role.id]).filter(Boolean).length

                  return (
                    <div key={role.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                      <p className="text-sm font-semibold text-foreground">{role.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
                      <p className="mt-3 text-2xl font-bold text-foreground">{activePermissions}</p>
                      <p className="text-xs text-muted-foreground">akses aktif</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
              <p className="font-semibold">Catatan Governance</p>
              <p className="mt-2 text-xs leading-5">
                Perubahan hak akses langsung aktif setelah toggle. Gunakan reset default hanya saat ingin mengembalikan seluruh konfigurasi ke baseline awal.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {managedRoles.map((role) => (
            <Card key={role.id} className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{role.label}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                  <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/10">
                    {Object.values(permissions[role.id]).filter(Boolean).length} aktif
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {PERMISSION_GROUPS.map((group) => (
                  <PermissionSection
                    key={`${role.id}-${group.id}`}
                    group={group}
                    role={role.id}
                    values={permissions[role.id]}
                    onToggle={handleToggle}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}

function PermissionSection({
  group,
  role,
  values,
  onToggle,
}: {
  group: PermissionGroup
  role: ManagedAdminRole
  values: Record<PermissionId, boolean>
  onToggle: (role: ManagedAdminRole, permissionId: PermissionId, enabled: boolean, label: string) => void
}) {
  const Icon = groupIcon(group.id)

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
        </div>
      </div>
      <div className="space-y-3">
        {group.permissions.map((permission) => (
          <div key={permission.id} className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{permission.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{permission.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("hidden text-xs font-medium sm:inline", values[permission.id] ? "text-primary" : "text-muted-foreground")}>
                {values[permission.id] ? "Enabled" : "Disabled"}
              </span>
              <Switch
                checked={values[permission.id]}
                onCheckedChange={(checked) => onToggle(role, permission.id, checked, permission.label)}
                aria-label={`Toggle ${permission.label}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
