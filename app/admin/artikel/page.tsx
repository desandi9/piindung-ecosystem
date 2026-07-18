"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowRight, CheckCircle2, FileText, Settings, ShieldAlert } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { Card, CardContent } from "@/components/ui/card"
import type { ArticleRetirementStatus, LegacyRetirementRecord } from "@/lib/article-retirement"

export default function ArtikelBeritaPage() {
  const router = useRouter()
  const [status, setStatus] = useState<ArticleRetirementStatus | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const loadStatus = useCallback(() => {
    setLoading(true)
    setError("")
    fetch("/api/articles/retirement-status")
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (!res.ok || !data || data.error) throw new Error(typeof data?.error === "string" ? data.error : "Gagal memuat status migrasi.")
        setStatus(data)
      })
      .catch((cause: unknown) => {
        setStatus(null)
        setError(cause instanceof Error ? cause.message : "Gagal memuat status migrasi.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  useEffect(() => {
    if (status?.fullyRetired) router.replace("/member-area/konten/artikel")
  }, [router, status])

  if (loading || status?.fullyRetired) {
    return <DashboardLayout><div className="flex h-[400px] items-center justify-center px-4 text-center text-sm text-muted-foreground">{status?.fullyRetired ? "Mengalihkan ke Member Area..." : "Memuat status retirement artikel lama..."}</div></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-amber-600">
              <Settings className="h-4 w-4" />
              Sistem Lama
            </div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">CMS Artikel Lama</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Pengelolaan artikel publik telah dipindahkan ke Member Area. Selesaikan migrasi atau arsipkan record yang tersisa di sini agar sistem lama dapat dinonaktifkan.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={() => router.push("/member-area/konten/artikel/migrasi")} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-semibold hover:bg-accent hover:text-foreground">Tinjau Migrasi</button>
            <button onClick={() => router.push("/member-area/konten/artikel")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-4 text-sm font-semibold text-white transition hover:bg-[#107947]">Buka Pengelolaan Artikel Baru <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>

        {error && <div className="flex flex-col gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button onClick={loadStatus} className="min-h-11 rounded-xl border border-destructive/30 px-4 font-semibold">Coba Lagi</button></div>}

        {status && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard title="Tersisa (Aktif)" value={String(status.activeLegacyCount)} />
              <SummaryCard title="Sudah Dimigrasi" value={String(status.migrationMapCount)} />
              <SummaryCard title="Selesai Diarsipkan" value={String(status.archiveCount)} />
            </div>

            <Card className="overflow-hidden border-border shadow-sm">
              <div className="border-b border-border p-5">
                <h2 className="text-lg font-bold text-foreground">Konten Lama Belum Selesai ({status.unresolved.length})</h2>
                <p className="mt-1 text-sm text-muted-foreground">Daftar ini hanya untuk peninjauan. Perubahan artikel lama tidak lagi tersedia dari halaman ini.</p>
              </div>
              <CardContent className="p-0">
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Judul</th>
                        <th className="px-5 py-3 text-left font-medium">Jenis</th>
                        <th className="px-5 py-3 text-left font-medium">Status Lama</th>
                        <th className="px-5 py-3 text-left font-medium">Status Retirement</th>
                        <th className="px-5 py-3 text-left font-medium">Ringkasan Masalah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {status.unresolved.map((record) => (
                        <tr key={record.legacyRecordKey} className="align-top">
                          <td className="px-5 py-4 font-medium text-foreground">{record.title || <span className="italic text-muted-foreground">Tanpa Judul</span>}</td>
                          <td className="px-5 py-4 capitalize">{record.type}</td>
                          <td className="px-5 py-4 capitalize">{record.status}</td>
                          <td className="px-5 py-4"><RecordStateBadge record={record} /></td>
                          <td className="px-5 py-4 text-muted-foreground">{record.issue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-4 p-4 lg:hidden">
                  {status.unresolved.map((record) => (
                    <article key={record.legacyRecordKey} className="rounded-2xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <RecordStateBadge record={record} />
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{record.type}</span>
                      </div>
                      <h3 className="mt-4 font-semibold text-foreground">{record.title || <span className="italic text-muted-foreground">Tanpa Judul</span>}</h3>
                      <p className="mt-2 text-xs text-muted-foreground capitalize">Status lama: {record.status}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{record.issue}</p>
                    </article>
                  ))}
                </div>
                {status.unresolved.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">Tidak ada artikel lama yang tersisa.</div>}
              </CardContent>
            </Card>
          </>
        )}

        {!status && !error && <Card className="border-border shadow-sm"><CardContent className="p-12 text-center text-sm text-muted-foreground">Tidak ada status retirement yang dapat ditampilkan.</CardContent></Card>}
      </div>
    </DashboardLayout>
  )
}

function RecordStateBadge({ record }: { record: LegacyRetirementRecord }) {
  if (record.retirementState === "migrated_not_archived") return <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400"><CheckCircle2 className="h-3.5 w-3.5" /> migrated_not_archived</span>
  if (record.retirementState === "invalid_or_conflicted") return <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive"><ShieldAlert className="h-3.5 w-3.5" /> invalid_or_conflicted</span>
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"><FileText className="h-3.5 w-3.5" /> unmigrated</span>
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-4 lg:p-5">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}
