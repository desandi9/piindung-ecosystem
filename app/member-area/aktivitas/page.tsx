"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Clock, Loader2 } from "lucide-react"
import { MemberLayout } from "@/components/member-area/member-shell"

type Activity = { id: string; label: string; description: string; category: string; timestamp: string }
type ApiResult = { activities: Activity[]; page: number; hasMore: boolean }
const format = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))

export default function AktivitasPage() {
  const [items, setItems] = useState<Activity[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [page, setPage] = useState(1); const [hasMore, setHasMore] = useState(false)
  const load = async () => { setLoading(true); setError(""); try { const response = await fetch(`/api/account/activity?page=${page}&limit=10`, { cache: "no-store" }); if (!response.ok) throw new Error("Aktivitas akun gagal dimuat."); const data = await response.json() as ApiResult;     setItems(data.activities); setHasMore(data.hasMore) } catch (cause) { setError(cause instanceof Error ? cause.message : "Terjadi kesalahan.") } finally { setLoading(false) } }
  useEffect(() => { void load() }, [page])
  return <MemberLayout title="Aktivitas Akun" breadcrumb="Member Area / Aktivitas"><section className="mx-auto max-w-4xl"><div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><h2 className="text-2xl font-bold">Riwayat Aktivitas</h2><p className="mt-2 text-sm text-muted-foreground">Log riwayat aktivitas akun Anda pada sistem.</p>{loading ? <p className="mt-8 flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memuat...</p> : error ? <div role="alert" className="mt-6 rounded-xl bg-destructive/10 p-4 text-destructive">{error}<button type="button" className="ml-3 underline" onClick={() => void load()}>Coba lagi</button></div> : items.length ? <ol className="mt-6 divide-y divide-border">{items.map((item) => <li key={item.id} className="flex gap-3 py-4"><Clock className="mt-0.5 h-5 w-5 text-primary" /><div><p className="font-medium">{item.label}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground">Kategori: {item.category}</p><time className="mt-2 block text-xs text-muted-foreground">{format(item.timestamp)}</time></div></li>)}</ol> : <p className="mt-6 text-muted-foreground">Belum ada aktivitas akun.</p>}<div className="mt-6 flex items-center justify-between"><Link href="/member-area" className="text-sm font-medium text-primary">Kembali ke Member Area</Link><div className="flex gap-2"><button className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50" disabled={page === 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><button className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50" disabled={!hasMore} onClick={() => setPage(page + 1)}>Berikutnya</button></div></div></div></section></MemberLayout>
}
