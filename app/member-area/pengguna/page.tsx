"use client"

import { type FormEvent, useDeferredValue, useEffect, useMemo, useState } from "react"
import { Eye, Plus, RotateCcw, Search, X, Pencil } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import {
  createManagedUser,
  isManagedUserPhoneTaken,
  isValidManagedUserPhone,
  refreshManagedUsers,
  updateManagedUser,
  useManagedUsers,
  type ManagedUser,
} from "@/lib/managed-users"
import { roleDisplayNames, type UserRole, useAuth } from "@/lib/auth-context"
import { useUserOperationalScopes } from "@/lib/user-operational-scope"
import { MemberLayout } from "@/components/member-area/member-shell"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"

const statusOptions = ["Aktif", "Menunggu", "Nonaktif"] as const

type StatusFilter = "all" | (typeof statusOptions)[number]

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) || "PG"
}

function statusClass(status: string) {
  if (status === "Aktif") return "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400"
  if (status === "Nonaktif") return "bg-muted text-muted-foreground"
  return "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "super_admin_pc", label: "Super Admin PC" },
  { value: "admin_pc", label: "Admin PC" },
  { value: "admin_upzis", label: "Admin UPZIS" },
  { value: "admin_kordes", label: "Admin Kordes / Ranting" },
]

function emptyForm() {
  return {
    name: "",
    email: "",
    phone: "",
    role: "admin_pc" as UserRole,
    status: "Aktif" as (typeof statusOptions)[number],
    password: "",
  }
}

function UserIdentity({ user }: { user: ManagedUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e6f7ee] text-xs font-bold text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">
        {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : initials(user.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
        {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
      </div>
    </div>
  )
}

export default function MemberUsersPage() {
  const { user, isLoading } = useAuth()
  const users = useManagedUsers()
  const [ready, setReady] = useState(false)
  const scopes = useUserOperationalScopes()
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [mutationTarget, setMutationTarget] = useState<ManagedUser | null>(null)
  const [mutationKind, setMutationKind] = useState<"role" | "status" | null>(null)
  const [mutationValue, setMutationValue] = useState("")
  const [isMutating, setIsMutating] = useState(false)
  const [mutationError, setMutationError] = useState("")
  const deferredQuery = useDeferredValue(query)
  const reduced = useReducedMotion()
  const reveal = reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const itemReveal = reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem
  const scopeByUser = useMemo(() => new Map(scopes.map((scope) => [scope.userId, scope])), [scopes])
  const roles = useMemo(() => Array.from(new Set(users.map((user) => user.role))), [users])
  const filteredUsers = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    return users.filter((user) => {
      const matchesQuery = !normalizedQuery || `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery)
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      return matchesQuery && matchesRole && matchesStatus
    })
  }, [deferredQuery, roleFilter, statusFilter, users])
  const activeCount = users.filter((user) => user.status === "Aktif").length
  const inactiveCount = users.filter((user) => user.status === "Nonaktif").length
  const roleCount = roles.length
  const currentUserId = user?.id
  const hasFilters = Boolean(query || roleFilter !== "all" || statusFilter !== "all")

  const handleOpenAdd = () => {
    setForm(emptyForm())
    setFormError("")
    setSaveMessage("")
    setFormMode("add")
  }

  const openRoleMutation = (targetUser: ManagedUser, value: UserRole) => {
    if (targetUser.id === user?.id) return
    setMutationTarget(targetUser)
    setMutationKind("role")
    setMutationValue(value)
    setMutationError("")
  }

  const openStatusMutation = (targetUser: ManagedUser, value: "Aktif" | "Nonaktif") => {
    if (targetUser.id === user?.id) return
    setMutationTarget(targetUser)
    setMutationKind("status")
    setMutationValue(value)
    setMutationError("")
  }

  const handleMutationConfirm = async () => {
    if (!mutationTarget || !mutationKind || !user || mutationTarget.id === user.id) return
    setIsMutating(true)
    setMutationError("")
    try {
      await updateManagedUser(mutationTarget.id, mutationKind === "role" ? { role: mutationValue as UserRole } : { status: mutationValue })
      await refreshManagedUsers()
      setSaveMessage(mutationKind === "role" ? "Role pengguna berhasil diperbarui." : "Status akun berhasil diperbarui.")
      setMutationTarget(null)
      setMutationKind(null)
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Gagal memperbarui pengguna.")
    } finally {
      setIsMutating(false)
    }
  }

  const handleOpenEdit = (targetUser: ManagedUser) => {
    setForm({
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone || "",
      role: targetUser.role,
      status: targetUser.status,
      password: "",
    })
    setFormError("")
    setSaveMessage("")
    setSelectedUser(targetUser)
    setFormMode("edit")
  }

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError("")

    const trimmedName = form.name.trim()
    const trimmedEmail = form.email.trim()
    const trimmedPhone = form.phone.trim()

    if (!trimmedName) {
      setFormError("Nama lengkap wajib diisi.")
      return
    }

    if (!trimmedEmail) {
      setFormError("Email wajib diisi.")
      return
    }

    const emailTaken = users.some((existingUser) => existingUser.email.toLowerCase() === trimmedEmail.toLowerCase() && existingUser.id !== selectedUser?.id)
    if (emailTaken) {
      setFormError("Email sudah digunakan oleh pengguna lain.")
      return
    }

    if (trimmedPhone) {
      if (!isValidManagedUserPhone(trimmedPhone)) {
        setFormError("Nomor telepon tidak valid.")
        return
      }
      if (isManagedUserPhoneTaken(trimmedPhone, formMode === "edit" ? selectedUser?.id : undefined)) {
        setFormError("Nomor telepon sudah digunakan.")
        return
      }
    }

    setIsSaving(true)
    try {
      if (formMode === "add") {
        if (!form.password || form.password.length < 6) {
          setFormError("Password wajib diisi minimal 6 karakter.")
          setIsSaving(false)
          return
        }
        await createManagedUser({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone || undefined,
          role: form.role,
          status: form.status,
          avatar: "",
          password: form.password,
        })
      } else if (formMode === "edit" && selectedUser) {
        await updateManagedUser(selectedUser.id, {
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone || undefined,
          role: selectedUser.id === user?.id ? selectedUser.role : form.role,
          status: selectedUser.id === user?.id ? selectedUser.status : form.status,
          avatar: selectedUser.avatar,
          password: form.password || undefined,
        })
      }
      await refreshManagedUsers()
      setSaveMessage(formMode === "add" ? "Pengguna berhasil dibuat." : "Data pengguna berhasil diperbarui.")
      setFormMode(null)
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan data pengguna. Periksa kembali email atau koneksi Anda.")
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!isLoading) {
      if (!user) window.location.replace("/login?next=/member-area/pengguna")
      else if (user.role !== "super_admin_pc") window.location.replace("/dashboard")
      else setReady(true)
    }
  }, [isLoading, user])

  const resetFilters = () => {
    setQuery("")
    setRoleFilter("all")
    setStatusFilter("all")
  }

  const organizationLabel = (user: ManagedUser) => scopeByUser.get(user.id)?.gorutWilayahLabel || scopeByUser.get(user.id)?.gorutKecamatan || "—"

  if (!ready || !user) return <div className="min-h-screen bg-background" />

  return (
    <MemberLayout title="Pengguna & Akses" breadcrumb="Member Area / Pengguna & Akses">
      <div className="space-y-7 overflow-x-hidden">
        {saveMessage && <div className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{saveMessage}</div>}
        <motion.section variants={reveal} initial="hidden" animate="visible">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">PENGGUNA &amp; AKSES</p>
          <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div><h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Daftar Pengguna</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Lihat akun, role, status, dan penempatan pengguna dalam ekosistem PIINDUNG.</p></div>
            <button type="button" onClick={handleOpenAdd} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#107947] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] focus-visible:ring-offset-2"><Plus className="h-4 w-4" /> Tambah Pengguna</button>
          </div>
        </motion.section>

        <motion.section variants={reduced ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Pengguna", users.length],
            ["Pengguna Aktif", activeCount],
            ["Role Terdaftar", roleCount],
            ["Akun Nonaktif", inactiveCount],
          ].map(([label, value]) => <motion.div key={label} variants={itemReveal} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold text-foreground">{value}</p></motion.div>)}
        </motion.section>

        <section className="rounded-[22px] border border-border bg-card p-4 shadow-sm sm:p-5" aria-label="Filter pengguna">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_200px_auto]">
            <label className="relative block"><span className="sr-only">Cari nama atau email</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau email" className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-[#15945b] focus:ring-2 focus:ring-[#15945b]/15" /></label>
            <label><span className="sr-only">Filter role</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-[#15945b]"> <option value="all">Semua Role</option>{roles.map((role) => <option key={role} value={role}>{roleDisplayNames[role as UserRole] || role}</option>)}</select></label>
            <label><span className="sr-only">Filter status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-[#15945b]"><option value="all">Semua Status</option>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
            {hasFilters && <button type="button" onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><RotateCcw className="h-4 w-4" /> Reset</button>}
          </div>
        </section>

        <motion.section variants={reduced ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="hidden overflow-hidden rounded-[22px] border border-border bg-card shadow-sm md:block" aria-label="Daftar pengguna">
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-border bg-muted/40"><tr className="text-xs uppercase tracking-wider text-muted-foreground"><th className="px-5 py-4 font-semibold">Pengguna</th><th className="px-5 py-4 font-semibold">Role</th><th className="px-5 py-4 font-semibold">Organisasi/Wilayah</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Terakhir Aktif</th><th className="px-5 py-4 text-right font-semibold">Detail</th></tr></thead><tbody className="divide-y divide-border">{filteredUsers.map((user) => <motion.tr key={user.id} variants={itemReveal} className="transition-colors hover:bg-accent/30"><td className="px-5 py-4"><UserIdentity user={user} /></td><td className="px-5 py-4"><select value={user.role} disabled={user.id === currentUserId} onChange={(event) => openRoleMutation(user, event.target.value as UserRole)} className="h-9 max-w-[180px] rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60" aria-label={`Ubah role ${user.name}`}>{roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></td><td className="px-5 py-4 text-sm text-muted-foreground">{organizationLabel(user)}</td><td className="px-5 py-4"><select value={user.status} disabled={user.id === currentUserId} onChange={(event) => openStatusMutation(user, event.target.value as "Aktif" | "Nonaktif")} className={cn("h-9 rounded-lg border border-border bg-background px-2 text-xs font-semibold", user.status === "Aktif" ? "text-[#15945b]" : "text-muted-foreground")} aria-label={`Ubah status ${user.name}`}>{user.status === "Menunggu" && <option value="Menunggu" disabled>Menunggu</option>}<option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option></select></td><td className="px-5 py-4 text-sm text-muted-foreground">{user.lastLogin || "—"}</td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedUser(user)} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#15945b] transition-colors hover:bg-[#e6f7ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:hover:bg-emerald-500/10"><Eye className="h-4 w-4" /> Detail</button><button type="button" onClick={() => handleOpenEdit(user)} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b]"><Pencil className="h-4 w-4" /> Edit</button></div></td></motion.tr>)}</tbody></table></div>
        </motion.section>

        <motion.section variants={reduced ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 md:hidden" aria-label="Daftar pengguna mobile">
          {filteredUsers.map((user) => <motion.article key={user.id} variants={itemReveal} className="rounded-[20px] border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><UserIdentity user={user} /><span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", statusClass(user.status))}>{user.status}</span></div><dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-xs text-muted-foreground">Role</dt><dd className="mt-1 font-medium text-foreground">{roleDisplayNames[user.role] || user.role}</dd></div><div><dt className="text-xs text-muted-foreground">Organisasi/Wilayah</dt><dd className="mt-1 font-medium text-foreground">{organizationLabel(user)}</dd></div></dl>{user.id !== currentUserId && <div className="mt-4 grid grid-cols-2 gap-2"><select value={user.role} onChange={(event) => openRoleMutation(user, event.target.value as UserRole)} className="h-11 min-w-0 rounded-xl border border-border bg-background px-2 text-xs font-medium text-foreground" aria-label={`Ubah role ${user.name}`}>{roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select><select value={user.status} onChange={(event) => openStatusMutation(user, event.target.value as "Aktif" | "Nonaktif")} className="h-11 min-w-0 rounded-xl border border-border bg-background px-2 text-xs font-medium text-foreground" aria-label={`Ubah status ${user.name}`}>{user.status === "Menunggu" && <option value="Menunggu" disabled>Menunggu</option>}<option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option></select></div>}<div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setSelectedUser(user)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e6f7ee] text-sm font-semibold text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400"><Eye className="h-4 w-4" /> Lihat Detail</button><button type="button" onClick={() => handleOpenEdit(user)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-muted-foreground"><Pencil className="h-4 w-4" /> Edit</button></div></motion.article>)}
        </motion.section>

        {!users.length && <div className="rounded-[22px] border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Belum ada data pengguna.</div>}
        {users.length > 0 && !filteredUsers.length && <div className="rounded-[22px] border border-dashed border-border bg-card p-10 text-center"><p className="font-semibold text-foreground">Pengguna tidak ditemukan.</p><button type="button" onClick={resetFilters} className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#15945b] px-4 text-sm font-semibold text-white">Reset filter</button></div>}

        {formMode && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormMode(null) }}><motion.form initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleFormSubmit} className="max-h-[90vh] w-full overflow-y-auto rounded-t-[24px] border border-border bg-card p-6 shadow-2xl sm:max-w-2xl sm:rounded-[24px]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">{formMode === "add" ? "TAMBAH PENGGUNA" : "EDIT PENGGUNA"}</p><h2 className="mt-2 text-2xl font-bold text-foreground">{formMode === "add" ? "Pengguna Baru" : form.name}</h2></div><button type="button" onClick={() => setFormMode(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent" aria-label="Tutup form"><X className="h-5 w-5" /></button></div>{formError && <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{formError}</div>}<div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-medium text-foreground">Nama lengkap</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#15945b]" required /></label><label className="space-y-2"><span className="text-sm font-medium text-foreground">Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#15945b]" required /></label><label className="space-y-2"><span className="text-sm font-medium text-foreground">Nomor telepon</span><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#15945b]" required placeholder="08xxxxxxxxxx" /><span className="text-xs text-muted-foreground">Gunakan format 08xxxxxxxxxx atau 62xxxxxxxxxx.</span></label><label className="space-y-2"><span className="text-sm font-medium text-foreground">Role</span><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} disabled={formMode === "edit"} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none disabled:opacity-60">{roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label><label className="space-y-2"><span className="text-sm font-medium text-foreground">Status akun</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as (typeof statusOptions)[number] })} disabled={formMode === "edit"} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none disabled:opacity-60">{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>{formMode === "add" && <label className="space-y-2"><span className="text-sm font-medium text-foreground">Password awal</span><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={6} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-[#15945b]" required /><span className="text-xs text-muted-foreground">Dibutuhkan oleh workflow pembuatan user saat ini.</span></label>}</div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setFormMode(null)} disabled={isSaving} className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground">Batal</button><button type="submit" disabled={isSaving} className="inline-flex h-11 items-center justify-center rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Menyimpan..." : "Simpan"}</button></div></motion.form></div>}

        {selectedUser && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedUser(null) }}><motion.aside initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-h-[90vh] w-full overflow-y-auto rounded-t-[24px] border border-border bg-card p-6 shadow-2xl sm:max-w-lg sm:rounded-[24px]" role="dialog" aria-modal="true" aria-labelledby="user-detail-title"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">DETAIL PENGGUNA</p><h2 id="user-detail-title" className="mt-2 text-2xl font-bold text-foreground">{selectedUser.name}</h2></div><div className="flex items-center gap-2"><button type="button" onClick={() => handleOpenEdit(selectedUser)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-muted-foreground hover:bg-accent"><Pencil className="h-4 w-4" /> Edit</button><button type="button" onClick={() => setSelectedUser(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent" aria-label="Tutup detail"><X className="h-5 w-5" /></button></div></div><div className="mt-6 flex items-center gap-4"><UserIdentity user={selectedUser} /></div><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between gap-4 border-b border-border pb-3"><dt className="text-muted-foreground">Role</dt><dd className="font-semibold text-foreground">{roleDisplayNames[selectedUser.role] || selectedUser.role}</dd></div><div className="flex justify-between gap-4 border-b border-border pb-3"><dt className="text-muted-foreground">Status</dt><dd><span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusClass(selectedUser.status))}>{selectedUser.status}</span></dd></div><div className="flex justify-between gap-4 border-b border-border pb-3"><dt className="text-muted-foreground">Organisasi/Wilayah</dt><dd className="text-right font-semibold text-foreground">{organizationLabel(selectedUser)}</dd></div>{selectedUser.email && <div className="flex justify-between gap-4 border-b border-border pb-3"><dt className="text-muted-foreground">Email</dt><dd className="max-w-[60%] break-all text-right font-semibold text-foreground">{selectedUser.email}</dd></div>}<div className="flex justify-between gap-4"><dt className="text-muted-foreground">Terakhir Aktif</dt><dd className="text-right font-semibold text-foreground">{selectedUser.lastLogin || "—"}</dd></div></dl></motion.aside></div>}

        {mutationTarget && mutationKind && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="presentation">
            <motion.div initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md overflow-hidden rounded-[24px] border border-border bg-card p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="mutation-dialog-title">
              <h2 id="mutation-dialog-title" className="text-xl font-bold text-foreground">
                {mutationKind === "role" ? "Konfirmasi Ubah Role" : "Konfirmasi Ubah Status"}
              </h2>
              {mutationError && <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{mutationError}</div>}
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {mutationKind === "role"
                  ? `Anda yakin ingin mengubah role pengguna ${mutationTarget.name} dari ${roleDisplayNames[mutationTarget.role]} menjadi ${roleDisplayNames[mutationValue as UserRole]}?`
                  : `Anda yakin ingin mengubah status akun ${mutationTarget.name} menjadi ${mutationValue}? ${mutationValue === "Nonaktif" ? "Pengguna tidak dapat mengakses sistem sampai akun diaktifkan kembali." : ""}`}
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => { setMutationTarget(null); setMutationKind(null) }} disabled={isMutating} className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground">Batal</button>
                <button type="button" onClick={handleMutationConfirm} disabled={isMutating} className={cn("inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition", mutationKind === "status" && mutationValue === "Nonaktif" ? "bg-destructive hover:bg-destructive/90" : "bg-[#15945b] hover:bg-[#107947]")}>{isMutating ? "Menyimpan..." : "Konfirmasi"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </MemberLayout>
  )
}
