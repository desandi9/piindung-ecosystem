"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Eye, RotateCcw, Search, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { useManagedUsers, type ManagedUser } from "@/lib/managed-users"
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
  const hasFilters = Boolean(query || roleFilter !== "all" || statusFilter !== "all")

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
        <motion.section variants={reveal} initial="hidden" animate="visible">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">PENGGUNA &amp; AKSES</p>
          <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div><h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Daftar Pengguna</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Lihat akun, role, status, dan penempatan pengguna dalam ekosistem PIINDUNG.</p></div>
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
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-border bg-muted/40"><tr className="text-xs uppercase tracking-wider text-muted-foreground"><th className="px-5 py-4 font-semibold">Pengguna</th><th className="px-5 py-4 font-semibold">Role</th><th className="px-5 py-4 font-semibold">Organisasi/Wilayah</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Terakhir Aktif</th><th className="px-5 py-4 text-right font-semibold">Detail</th></tr></thead><tbody className="divide-y divide-border">{filteredUsers.map((user) => <motion.tr key={user.id} variants={itemReveal} className="transition-colors hover:bg-accent/30"><td className="px-5 py-4"><UserIdentity user={user} /></td><td className="px-5 py-4 text-sm text-muted-foreground">{roleDisplayNames[user.role] || user.role}</td><td className="px-5 py-4 text-sm text-muted-foreground">{organizationLabel(user)}</td><td className="px-5 py-4"><span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusClass(user.status))}>{user.status}</span></td><td className="px-5 py-4 text-sm text-muted-foreground">{user.lastLogin || "—"}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelectedUser(user)} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#15945b] transition-colors hover:bg-[#e6f7ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15945b] dark:hover:bg-emerald-500/10"><Eye className="h-4 w-4" /> Detail</button></td></motion.tr>)}</tbody></table></div>
        </motion.section>

        <motion.section variants={reduced ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 md:hidden" aria-label="Daftar pengguna mobile">
          {filteredUsers.map((user) => <motion.article key={user.id} variants={itemReveal} className="rounded-[20px] border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><UserIdentity user={user} /><span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", statusClass(user.status))}>{user.status}</span></div><dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-xs text-muted-foreground">Role</dt><dd className="mt-1 font-medium text-foreground">{roleDisplayNames[user.role] || user.role}</dd></div><div><dt className="text-xs text-muted-foreground">Organisasi/Wilayah</dt><dd className="mt-1 font-medium text-foreground">{organizationLabel(user)}</dd></div></dl><button type="button" onClick={() => setSelectedUser(user)} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e6f7ee] text-sm font-semibold text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400"><Eye className="h-4 w-4" /> Lihat Detail</button></motion.article>)}
        </motion.section>

        {!users.length && <div className="rounded-[22px] border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Belum ada data pengguna.</div>}
        {users.length > 0 && !filteredUsers.length && <div className="rounded-[22px] border border-dashed border-border bg-card p-10 text-center"><p className="font-semibold text-foreground">Pengguna tidak ditemukan.</p><button type="button" onClick={resetFilters} className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#15945b] px-4 text-sm font-semibold text-white">Reset filter</button></div>}

        {selectedUser && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedUser(null) }}><motion.aside initial={reduced ? { opacity: 1 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-h-[90vh] w-full overflow-y-auto rounded-t-[24px] border border-border bg-card p-6 shadow-2xl sm:max-w-lg sm:rounded-[24px]" role="dialog" aria-modal="true" aria-labelledby="user-detail-title"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">DETAIL PENGGUNA</p><h2 id="user-detail-title" className="mt-2 text-2xl font-bold text-foreground">{selectedUser.name}</h2></div><button type="button" onClick={() => setSelectedUser(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent" aria-label="Tutup detail"><X className="h-5 w-5" /></button></div><div className="mt-6 flex items-center gap-4"><UserIdentity user={selectedUser} /></div><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between gap-4 border-b border-border pb-3"><dt className="text-muted-foreground">Role</dt><dd className="font-semibold text-foreground">{roleDisplayNames[selectedUser.role] || selectedUser.role}</dd></div><div className="flex justify-between gap-4 border-b border-border pb-3"><dt className="text-muted-foreground">Status</dt><dd><span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusClass(selectedUser.status))}>{selectedUser.status}</span></dd></div><div className="flex justify-between gap-4 border-b border-border pb-3"><dt className="text-muted-foreground">Organisasi/Wilayah</dt><dd className="text-right font-semibold text-foreground">{organizationLabel(selectedUser)}</dd></div>{selectedUser.email && <div className="flex justify-between gap-4 border-b border-border pb-3"><dt className="text-muted-foreground">Email</dt><dd className="max-w-[60%] break-all text-right font-semibold text-foreground">{selectedUser.email}</dd></div>}<div className="flex justify-between gap-4"><dt className="text-muted-foreground">Terakhir Aktif</dt><dd className="text-right font-semibold text-foreground">{selectedUser.lastLogin || "—"}</dd></div></dl></motion.aside></div>}
      </div>
    </MemberLayout>
  )
}
