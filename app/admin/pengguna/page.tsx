"use client"

import { FormEvent, useDeferredValue, useEffect, useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import {
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Clock3,
  Trash2,
  UserRound,
  Users,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { addActivityLog } from "@/lib/activity-log"
import { useAuth, roleDisplayNames, type UserRole } from "@/lib/auth-context"
import { gorutKecamatanOptions } from "@/lib/gorut-kecamatan"
import { upsertUserOperationalScope, useUserOperationalScopes } from "@/lib/user-operational-scope"
import { cn } from "@/lib/utils"
import {
  createManagedUser,
  deleteManagedUser,
  formatManagedUserPhone,
  isManagedUserPhoneTaken,
  isValidManagedUserPhone,
  normalizeManagedUserPhone,
  resetManagedUserPassword,
  updateManagedUser,
  useManagedUsers,
  type ManagedUser,
  type UserStatus,
} from "@/lib/managed-users"

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "super_admin_pc", label: roleDisplayNames.super_admin_pc },
  { value: "admin_pc", label: roleDisplayNames.admin_pc },
  { value: "admin_upzis", label: roleDisplayNames.admin_upzis },
  { value: "admin_kordes", label: roleDisplayNames.admin_kordes },
]

const roleFilters = [{ value: "all", label: "Semua Role" }, ...roleOptions]
const statusOptions: UserStatus[] = ["Aktif", "Menunggu", "Nonaktif"]

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  role: "admin_pc" as UserRole,
  gorutKecamatan: "",
  status: "Aktif" as UserStatus,
  avatar: "",
  password: "admin123",
}

function statusClassName(status: string) {
  if (status === "Aktif") return "bg-primary/10 text-primary hover:bg-primary/10"
  if (status === "Menunggu") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

export default function KelolaPenggunaPage() {
  const users = useManagedUsers()
  const userOperationalScopes = useUserOperationalScopes()
  const { user: currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "detail" | null>(null)
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)
  const deferredSearch = useDeferredValue(searchQuery)
  const totalActiveUsers = users.filter((item) => item.status === "Aktif").length
  const waitingUsers = users.filter((item) => item.status === "Menunggu").length
  const superAdminCount = users.filter((item) => item.role === "super_admin_pc").length
  const operationalScopeByUserId = new Map(userOperationalScopes.map((item) => [item.userId, item]))

  const filteredUsers = users.filter((user) => {
    const query = deferredSearch.toLowerCase()
    const matchesSearch = user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || (user.phone ?? "").toLowerCase().includes(query)
    const matchesRole = selectedRole === "all" || user.role === selectedRole

    return matchesSearch && matchesRole
  })

  function openAddDialog() {
    setSelectedUser(null)
    setForm(emptyForm)
    setDialogMode("add")
  }

  function openUserDialog(mode: "edit" | "detail", user: ManagedUser) {
    setSelectedUser(user)
    setForm({
      name: user.name,
      phone: user.phone ?? "",
      email: user.email,
      role: user.role,
      gorutKecamatan: operationalScopeByUserId.get(user.id)?.gorutKecamatan ?? "",
      status: user.status,
      avatar: user.avatar,
      password: "",
    })
    setDialogMode(mode)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    try {
      if (!isValidManagedUserPhone(form.phone)) {
        toast.error("Nomor HP harus valid dan diawali 08 atau 62.")
        return
      }

      if (isManagedUserPhoneTaken(form.phone, selectedUser?.id)) {
        toast.error("Nomor HP sudah digunakan oleh pengguna lain.")
        return
      }

      if (form.role === "admin_upzis" && !form.gorutKecamatan.trim()) {
        toast.error("Admin UPZIS wajib ditetapkan ke salah satu kecamatan.")
        return
      }

      if (dialogMode === "edit" && selectedUser) {
        const updatedUser = await updateManagedUser(selectedUser.id, {
          name: form.name,
          phone: form.phone,
          email: form.email,
          role: form.role,
          status: form.status,
          avatar: form.avatar,
          password: form.password,
        })
        await upsertUserOperationalScope({
          userId: updatedUser.id,
          role: form.role,
          gorutKecamatan: form.role === "admin_upzis" ? form.gorutKecamatan || undefined : undefined,
        })
        addActivityLog({
          userName: currentUser?.name || "Admin",
          type: "User",
          action: `Memperbarui pengguna ${form.name}`,
          status: "Success",
        })
        toast.success("Pengguna berhasil diperbarui")
      } else {
        const createdUser = await createManagedUser({
          name: form.name,
          phone: form.phone,
          email: form.email,
          role: form.role,
          status: form.status,
          avatar: form.avatar,
          password: form.password,
        })
        await upsertUserOperationalScope({
          userId: createdUser.id,
          role: form.role,
          gorutKecamatan: form.role === "admin_upzis" ? form.gorutKecamatan || undefined : undefined,
        })
        addActivityLog({
          userName: currentUser?.name || "Admin",
          type: "User",
          action: `Menambahkan pengguna ${form.name}`,
          status: "Success",
        })
        toast.success("Pengguna berhasil ditambahkan")
      }

      setDialogMode(null)
    } catch (error) {
      console.error(error)
      toast.error("Gagal menyimpan pengguna")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(user: ManagedUser) {
    if (user.id === currentUser?.id) {
      toast.error("Akun yang sedang digunakan tidak bisa dihapus.")
      return
    }

    setDeleteTarget(user)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsDeletingId(deleteTarget.id)

    try {
      await deleteManagedUser(deleteTarget.id)
      addActivityLog({
        userName: currentUser?.name || "Admin",
        type: "User",
        action: `Menghapus pengguna ${deleteTarget.name}`,
        status: "Warning",
      })
      toast.success("Pengguna berhasil dihapus")
    } catch (error) {
      console.error(error)
      toast.error("Gagal menghapus pengguna")
    } finally {
      setDeleteTarget(null)
      setIsDeletingId(null)
    }
  }

  async function handleRoleChange(user: ManagedUser, role: UserRole) {
    if (user.id === currentUser?.id && role !== user.role) {
      toast.error("Role akun yang sedang digunakan tidak bisa diubah dari daftar cepat.")
      return
    }

    try {
      await updateManagedUser(user.id, { role })
      addActivityLog({
        userName: currentUser?.name || "Admin",
        type: "User",
        action: `Mengubah role ${user.name} menjadi ${roleDisplayNames[role]}`,
        status: "Success",
      })
      toast.success("Role diperbarui")
    } catch (error) {
      console.error(error)
      toast.error("Gagal memperbarui role")
    }
  }

  async function handleStatusToggle(user: ManagedUser, active: boolean) {
    if (user.id === currentUser?.id && !active) {
      toast.error("Akun yang sedang digunakan tidak bisa dinonaktifkan.")
      return
    }

    try {
      await updateManagedUser(user.id, { status: active ? "Aktif" : "Nonaktif" })
      addActivityLog({
        userName: currentUser?.name || "Admin",
        type: "User",
        action: `${active ? "Mengaktifkan" : "Menonaktifkan"} pengguna ${user.name}`,
        status: "Success",
      })
      toast.success("Status pengguna diperbarui")
    } catch (error) {
      console.error(error)
      toast.error("Gagal memperbarui status")
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resetUser) return

    setIsResetting(true)

    try {
      await resetManagedUserPassword(resetUser.id, newPassword)
      addActivityLog({
        userName: currentUser?.name || "Admin",
        type: "User",
        action: `Reset password pengguna ${resetUser.name}`,
        status: "Success",
      })
      toast.success("Password berhasil direset")
      setResetUser(null)
    } catch (error) {
      console.error(error)
      toast.error("Gagal reset password")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Manajemen Akses Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Kelola Pengguna</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola akun, peran, dan akses pengguna PIINDUNG secara amanah.
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20">
            <Plus className="h-4 w-4" />
            Tambah Pengguna
          </Button>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 lg:p-5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari nama, nomor HP, atau email pengguna..."
                  className="h-10 rounded-xl bg-muted/50 pl-9"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              >
                {roleFilters.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InlineSummaryCard icon={Users} title="Total Pengguna" value={String(users.length)} description="Seluruh akun admin yang tersimpan di sistem." />
          <InlineSummaryCard icon={ShieldCheck} title="Akun Aktif" value={String(totalActiveUsers)} description="Pengguna yang saat ini bisa mengakses area admin." />
          <InlineSummaryCard icon={Clock3} title="Menunggu Aktivasi" value={String(waitingUsers)} description="Akun yang masih perlu review atau aktivasi." />
          <InlineSummaryCard icon={AlertTriangle} title="Super Admin" value={String(superAdminCount)} description="Jumlah akun dengan akses tertinggi yang perlu dijaga." />
        </div>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Daftar Pengguna</CardTitle>
            <CardDescription>{filteredUsers.length} pengguna ditampilkan</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Pengguna</th>
                    <th className="px-5 py-3 text-left font-medium">Nomor HP</th>
                    <th className="px-5 py-3 text-left font-medium">Role</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Login Terakhir</th>
                    <th className="px-5 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border transition-colors hover:bg-muted/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Image src={user.avatar} alt={user.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover ring-2 ring-card" />
                          <div>
                            <p className="font-semibold text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.role === "admin_upzis" && operationalScopeByUserId.get(user.id)?.gorutKecamatan ? (
                              <p className="text-xs text-primary">Admin UPZIS Kecamatan {operationalScopeByUserId.get(user.id)?.gorutKecamatan}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-foreground">{formatManagedUserPhone(user.phone)}</div>
                        <div className="text-xs text-muted-foreground">{user.phone ? normalizeManagedUserPhone(user.phone) : "Nomor HP belum diisi"}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <select
                            value={user.role}
                            onChange={(event) => handleRoleChange(user, event.target.value as UserRole)}
                            className="h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                          >
                            {roleOptions.map((role) => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                          {user.role === "admin_upzis" && operationalScopeByUserId.get(user.id)?.gorutKecamatan ? (
                            <p className="text-xs text-muted-foreground">Kecamatan: {operationalScopeByUserId.get(user.id)?.gorutKecamatan}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Switch checked={user.status === "Aktif"} onCheckedChange={(checked) => handleStatusToggle(user, checked)} disabled={user.id === currentUser?.id} />
                          <Badge className={cn("border-0", statusClassName(user.status))}>{user.status}</Badge>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{user.lastLogin}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <ActionButton icon={Eye} label="Detail" onClick={() => openUserDialog("detail", user)} />
                          <ActionButton icon={Pencil} label="Edit" onClick={() => openUserDialog("edit", user)} />
                           <ActionButton icon={KeyRound} label="Reset Password" onClick={() => { setResetUser(user); setNewPassword(""); setShowResetPassword(false) }} />
                             <ActionButton icon={Trash2} label={isDeletingId === user.id ? "Menghapus..." : "Hapus"} destructive onClick={() => handleDelete(user)} disabled={isDeletingId === user.id || user.id === currentUser?.id} />
                           </div>
                         </td>
                       </tr>
                  ))}
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-muted/20 p-6">
                          <p className="text-sm font-semibold text-foreground">Tidak ada pengguna yang cocok</p>
                          <p className="mt-2 text-xs text-muted-foreground">Coba ubah kata kunci pencarian atau filter role untuk melihat data lainnya.</p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 lg:hidden">
              {filteredUsers.map((user) => (
                <div key={user.id} className="rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <Image src={user.avatar} alt={user.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-2 ring-card" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.phone ? formatManagedUserPhone(user.phone) : "Nomor HP belum diisi"}</p>
                      <p className="text-xs text-muted-foreground">{user.email || "Email belum diisi"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge className={cn("border-0", statusClassName(user.status))}>{user.status}</Badge>
                        <span className="text-xs text-muted-foreground">{roleDisplayNames[user.role]}</span>
                        {user.role === "admin_upzis" && operationalScopeByUserId.get(user.id)?.gorutKecamatan ? (
                          <span className="text-xs text-primary">{operationalScopeByUserId.get(user.id)?.gorutKecamatan}</span>
                        ) : null}
                      </div>
                    </div>
                    <Switch checked={user.status === "Aktif"} onCheckedChange={(checked) => handleStatusToggle(user, checked)} disabled={user.id === currentUser?.id} />
                  </div>
                  <select
                    value={user.role}
                    onChange={(event) => handleRoleChange(user, event.target.value as UserRole)}
                    className="mt-4 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                  {user.role === "admin_upzis" && operationalScopeByUserId.get(user.id)?.gorutKecamatan ? (
                    <p className="mt-2 text-xs text-muted-foreground">Kecamatan: {operationalScopeByUserId.get(user.id)?.gorutKecamatan}</p>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ActionButton icon={Eye} label="Detail" compact onClick={() => openUserDialog("detail", user)} />
                    <ActionButton icon={Pencil} label="Edit" compact onClick={() => openUserDialog("edit", user)} />
                    <ActionButton icon={KeyRound} label="Reset" compact onClick={() => { setResetUser(user); setNewPassword(""); setShowResetPassword(false) }} />
                    <ActionButton icon={Trash2} label={isDeletingId === user.id ? "Menghapus..." : "Hapus"} compact destructive onClick={() => handleDelete(user)} disabled={isDeletingId === user.id || user.id === currentUser?.id} />
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center">
                  <p className="text-sm font-semibold text-foreground">Tidak ada pengguna yang cocok</p>
                  <p className="mt-2 text-xs text-muted-foreground">Coba kata kunci lain atau reset filter role.</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <UserDialog
        mode={dialogMode}
        form={form}
        selectedUser={selectedUser}
        onOpenChange={(open) => !open && setDialogMode(null)}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />

      <Dialog open={Boolean(resetUser)} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>Password baru untuk {resetUser?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showResetPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  minLength={6}
                  placeholder="Masukkan password baru"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResetPassword((current) => !current)}
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Gunakan password baru minimal 6 karakter. Contoh default jika ingin cepat: `admin123`.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetUser(null)}>Batal</Button>
              <Button type="submit" disabled={isResetting}>{isResetting ? "Menyimpan..." : "Simpan Password"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Pengguna"
        description={deleteTarget ? `Akun \"${deleteTarget.name}\" akan dihapus dari daftar pengguna.` : ""}
        confirmLabel="Hapus Pengguna"
        destructive
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  )
}

function InlineSummaryCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: typeof UserRound
  title: string
  value: string
  description: string
}) {
  return (
    <Card className="border-border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4 lg:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function UserDialog({
  mode,
  form,
  selectedUser,
  onOpenChange,
  onFormChange,
  onSubmit,
  isSaving,
}: {
  mode: "add" | "edit" | "detail" | null
  form: typeof emptyForm
  selectedUser: ManagedUser | null
  onOpenChange: (open: boolean) => void
  onFormChange: (form: typeof emptyForm) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSaving: boolean
}) {
  const isDetail = mode === "detail"
  const normalizedPhone = normalizeManagedUserPhone(form.phone)
  const showPhoneValidation = !isDetail && form.phone.trim().length > 0
  const phoneIsValid = isValidManagedUserPhone(form.phone)
  const phoneIsDuplicate = phoneIsValid && isManagedUserPhoneTaken(form.phone, selectedUser?.id)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!mode) return
    setShowPassword(false)
  }, [mode, selectedUser?.id])

  return (
    <Dialog open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Tambah Pengguna" : mode === "edit" ? "Edit Pengguna" : "Detail Pengguna"}</DialogTitle>
            <DialogDescription>Lengkapi data akun, role, dan status akses pengguna.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-muted">
                <Image src={form.avatar || selectedUser?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&q=80"} alt={form.name || "Avatar"} fill sizes="96px" className="object-cover" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} disabled={isDetail} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor HP</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={isDetail ? formatManagedUserPhone(form.phone) : form.phone}
                  onChange={(event) => onFormChange({ ...form, phone: event.target.value })}
                  disabled={isDetail}
                  aria-invalid={showPhoneValidation && (!phoneIsValid || phoneIsDuplicate)}
                  required
                />
                {!isDetail ? (
                  <p className={cn(
                    "text-xs",
                    form.phone.trim().length === 0 || (phoneIsValid && !phoneIsDuplicate)
                      ? "text-muted-foreground"
                      : "text-destructive"
                  )}>
                    {form.phone.trim().length === 0
                      ? "Gunakan format 08xxxxxxxxxx atau 62xxxxxxxxxx"
                      : !phoneIsValid
                        ? "Nomor HP harus valid dan diawali 08 atau 62."
                        : phoneIsDuplicate
                          ? "Nomor HP sudah digunakan oleh pengguna lain."
                          : `Nomor tersimpan sebagai ${formatManagedUserPhone(normalizedPhone)}`}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(event) => onFormChange({ ...form, email: event.target.value })} disabled={isDetail} placeholder="Opsional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(event) => onFormChange({ ...form, role: event.target.value as UserRole, gorutKecamatan: gorutScopedOperationalRoles.includes(event.target.value as UserRole) ? form.gorutKecamatan : "" })}
                  disabled={isDetail}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              {gorutScopedOperationalRoles.includes(form.role) ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="gorutKecamatan">Kecamatan Operasional GORUT</Label>
                  <select
                    id="gorutKecamatan"
                    value={form.gorutKecamatan}
                    onChange={(event) => onFormChange({ ...form, gorutKecamatan: event.target.value })}
                    disabled={isDetail}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                    required={!isDetail}
                  >
                    <option value="">Pilih kecamatan</option>
                    {gorutKecamatanOptions.map((kecamatan) => (
                      <option key={kecamatan} value={kecamatan}>{kecamatan}</option>
                    ))}
                  </select>
                  {!isDetail ? <p className="text-xs text-muted-foreground">Contoh: {roleDisplayNames[form.role]} Kecamatan Garut Kota.</p> : null}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) => onFormChange({ ...form, status: event.target.value as UserStatus })}
                  disabled={isDetail}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="avatar">URL Avatar</Label>
                <Input id="avatar" value={form.avatar} onChange={(event) => onFormChange({ ...form, avatar: event.target.value })} disabled={isDetail} placeholder="https://..." />
              </div>
              {mode && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="password">{mode === "add" ? "Password Awal" : "Password"}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => onFormChange({ ...form, password: event.target.value })}
                      readOnly={isDetail}
                      required={mode === "add"}
                      minLength={6}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isDetail ? "Password disembunyikan untuk keamanan." : "Kosongkan jika tidak ingin mengubah password."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {!isDetail && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Batal</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Menyimpan..." : "Simpan"}</Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ActionButton({
  icon: Icon,
  label,
  compact,
  destructive,
  disabled,
  onClick,
}: {
  icon: typeof UserRound
  label: string
  compact?: boolean
  destructive?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "gap-2 rounded-xl hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
        destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive",
        compact && "w-full px-2 text-xs"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
