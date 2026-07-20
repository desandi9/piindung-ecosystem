"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Search, X } from "lucide-react"
import { MemberLayout } from "@/components/member-area/member-shell"
import { roleDisplayNames, useAuth } from "@/lib/auth-context"
import { registeredModules } from "@/lib/portal-access"
import { appRoles, userStatuses, type UserStatus } from "@/lib/portal-user-management"
import type { AppRole } from "@/types/auth"

type UserItem = { id: string; name: string; email: string | null; phone: string; role: AppRole; status: UserStatus; updatedAt: string; modules: Array<{ key: string; name: string }> }
type Form = { name: string; email: string; phone: string; password: string; role: AppRole; status: UserStatus; gorut: boolean }
const emptyForm: Form = { name: "", email: "", phone: "", password: "", role: "admin_pc", status: "Aktif", gorut: false }

export default function MemberUsersPage() {
  const { user, isLoading } = useAuth()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("")
  const [status, setStatus] = useState("")
  const [editing, setEditing] = useState<UserItem | null | undefined>(undefined)
  const [form, setForm] = useState<Form>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true); setError("")
    const params = new URLSearchParams({ search, role, status })
    try {
      const response = await fetch(`/api/users?${params}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal memuat pengguna.")
      setUsers(data.users || [])
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal memuat pengguna.") }
    finally { setLoading(false) }
  }

  useEffect(() => { if (!isLoading && user?.role === "super_admin_pc") void load() }, [isLoading, user, search, role, status])
  useEffect(() => { if (!isLoading && !user) window.location.replace("/login?next=/member-area/pengguna"); else if (!isLoading && user?.role !== "super_admin_pc") window.location.replace("/dashboard") }, [isLoading, user])

  const openCreate = () => { setForm(emptyForm); setEditing(null); setError(""); setMessage("") }
  const openEdit = (target: UserItem) => { setEditing(target); setForm({ name: target.name, email: target.email ?? "", phone: target.phone, password: "", role: target.role, status: target.status, gorut: target.modules.some((module) => module.key === "gorut") }); setError(""); setMessage("") }
  const title = editing ? `Edit ${editing.name}` : "Tambah Pengguna"

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("")
    try {
      const modules = [{ key: "gorut", enabled: form.gorut }]
      const response = await fetch(editing ? `/api/users/${editing.id}` : "/api/users", { method: editing ? "PATCH" : "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing ? { name: form.name, email: form.email, phone: form.phone, role: form.role, status: form.status, modules } : { name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role, status: form.status, modules }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan pengguna.")
      setMessage(editing ? "Pengguna berhasil diperbarui." : "Pengguna berhasil dibuat."); setEditing(undefined); setForm(emptyForm); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal menyimpan pengguna.") }
    finally { setSaving(false); setForm((current) => ({ ...current, password: "" })) }
  }

  const visible = useMemo(() => users, [users])
  if (isLoading || !user || user.role !== "super_admin_pc") return <div className="min-h-screen bg-background" />
  return <MemberLayout title="Pengguna" breadcrumb="Member Area / Pengguna">
    <div className="space-y-6 overflow-x-hidden">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#15945b]">PENGGUNA PIINDUNG</p><h1 className="mt-2 text-3xl font-bold">Manajemen Pengguna</h1><p className="mt-2 text-muted-foreground">Kelola identitas pusat, role organisasi, status akun, dan akses masuk modul.</p></div><button onClick={openCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-4 font-semibold text-white"><Plus className="h-4 w-4" /> Tambah Pengguna</button></header>
      {message && <div role="status" className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700">{message}</div>}{error && <div role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <section className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-[1fr_220px_180px]"><label className="relative"><span className="sr-only">Cari nama atau email</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email" className="h-11 w-full rounded-xl border bg-background pl-10 pr-3" /></label><label><span className="sr-only">Filter role</span><select value={role} onChange={(event) => setRole(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3"><option value="">Semua role</option>{appRoles.map((value) => <option key={value} value={value}>{roleDisplayNames[value]}</option>)}</select></label><label><span className="sr-only">Filter status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-xl border bg-background px-3"><option value="">Semua status</option>{userStatuses.map((value) => <option key={value}>{value}</option>)}</select></label></section>
      {loading ? <div className="rounded-2xl border p-10 text-center text-muted-foreground">Memuat pengguna...</div> : visible.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Tidak ada pengguna yang sesuai.</div> : <section className="grid gap-3">{visible.map((item) => <article key={item.id} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[minmax(0,1fr)_180px_120px_180px_auto] md:items-center"><div className="min-w-0"><h2 className="truncate font-semibold">{item.name}</h2><p className="truncate text-sm text-muted-foreground">{item.email}</p></div><p className="text-sm">{roleDisplayNames[item.role]}</p><span className="text-sm font-semibold">{item.status}</span><p className="text-sm text-muted-foreground">GORUT: {item.status !== "Aktif" ? "Tidak efektif" : item.modules.some((module) => module.key === "gorut") ? "Aktif" : "Nonaktif"}</p><button onClick={() => openEdit(item)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 font-semibold"><Pencil className="h-4 w-4" /> Edit</button></article>)}</section>}
      <aside className="rounded-2xl border bg-muted/30 p-4 text-sm"><strong>Di luar PIINDUNG:</strong> Wilayah kerja, transaksi, validasi, dan kewenangan operasional dikelola di dalam modul terkait.</aside>
      {editing !== undefined && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><form onSubmit={submit} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-card p-6 sm:max-w-2xl sm:rounded-3xl"><div className="flex justify-between"><h2 className="text-2xl font-bold">{title}</h2><button type="button" onClick={() => setEditing(undefined)} aria-label="Tutup"><X /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Nama"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} className="h-11 w-full rounded-xl border px-3" /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="h-11 w-full rounded-xl border px-3" /></Field><Field label="Nomor HP"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="h-11 w-full rounded-xl border px-3" /></Field>{!editing && <Field label="Password awal"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} autoComplete="new-password" className="h-11 w-full rounded-xl border px-3" /></Field>}<Field label="Role"><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppRole })} className="h-11 w-full rounded-xl border px-3">{appRoles.map((value) => <option key={value} value={value}>{roleDisplayNames[value]}</option>)}</select></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })} className="h-11 w-full rounded-xl border px-3">{userStatuses.map((value) => <option key={value}>{value}</option>)}</select></Field></div><section className="mt-6 rounded-2xl border p-4"><h3 className="font-bold">Akses Modul</h3><label className="mt-3 flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.gorut} onChange={(e) => setForm({ ...form, gorut: e.target.checked })} disabled={form.role === "super_admin_pc"} /> {registeredModules[0].name} entry {form.status !== "Aktif" && "(tidak efektif selama akun nonaktif)"}</label><p className="mt-2 text-sm text-muted-foreground">Grant PIINDUNG hanya mengizinkan masuk. Kewenangan operasional tetap dikelola modul.</p></section><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEditing(undefined)} className="min-h-11 rounded-xl border px-5">Batal</button><button disabled={saving} className="min-h-11 rounded-xl bg-[#15945b] px-5 font-semibold text-white disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button></div></form></div>}
    </div>
  </MemberLayout>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="text-sm font-semibold">{label}</span>{children}</label> }
