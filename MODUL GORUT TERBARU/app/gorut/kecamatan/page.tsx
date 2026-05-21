'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MapPin,
  Users,
  Coins,
  Search,
  ArrowUpRight,
  MoreHorizontal,
  Building2,
  TriangleAlert,
  ArrowRight,
  ShieldCheck,
  Clock3,
} from 'lucide-react'
import { formatDateShort, formatRupiah } from '@/lib/gorut/data'
import { getWilayahOverview } from '@/lib/gorut/wilayah'
import { cn } from '@/lib/utils'

type SortKey = 'total' | 'aktif' | 'nama' | 'health'

export default function KecamatanPage() {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('total')
  const [selected, setSelected] = useState<ReturnType<typeof getWilayahOverview>['kecamatan'][number] | null>(null)

  const rows = useMemo(() => getWilayahOverview().kecamatan, [])

  const filteredRows = useMemo(() => {
    const filtered = rows.filter((row) => row.nama.toLowerCase().includes(search.toLowerCase()))
    filtered.sort((a, b) => {
      if (sortKey === 'nama') return a.nama.localeCompare(b.nama)
      if (sortKey === 'aktif') return b.activationRate - a.activationRate
      if (sortKey === 'health') return b.healthScore - a.healthScore
      return b.totalTerkumpul - a.totalTerkumpul
    })
    return filtered
  }, [rows, search, sortKey])

  const summary = useMemo(() => {
    const total = rows.length
    const totalCollected = rows.reduce((sum, row) => sum + row.totalTerkumpul, 0)
    const totalKotakAktif = rows.reduce((sum, row) => sum + row.jumlahKotakAktif, 0)
    const underperforming = rows.filter((row) => row.activationRate < 85).length
    const pendingTransactions = rows.reduce((sum, row) => sum + row.pendingTransactions, 0)
    const topArea = [...rows].sort((a, b) => b.totalTerkumpul - a.totalTerkumpul)[0]
    const healthiest = [...rows].sort((a, b) => b.healthScore - a.healthScore)[0]
    return { total, totalCollected, totalKotakAktif, underperforming, pendingTransactions, topArea, healthiest }
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Wilayah (Kecamatan)</h1>
          <p className="text-sm text-muted-foreground">Monitoring performa wilayah, aktivasi kotak, dan konsentrasi penghimpunan per kecamatan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/gorut/ranting">
              <Building2 className="size-4" />
              Buka Ranting / PLPK
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/gorut/rekap-bulanan">
              <ArrowRight className="size-4" />
              Rekap Wilayah
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border border-border/40 bg-card/90 shadow-sm backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/12 via-transparent to-blue-500/8 px-5 py-5">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <Badge variant="outline" className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-600">
                  Regional Control Deck
                </Badge>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Lihat wilayah terkuat, area yang butuh intervensi, dan distribusi aktivasi kotak tanpa pindah halaman.</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Saya rapikan halaman kecamatan supaya cocok buat super admin: cepat baca ranking, cepat buka area bermasalah, dan tetap enak dipakai di desktop maupun mobile.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/40 bg-background/60 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Top Wilayah</p><p className="mt-2 text-sm font-semibold">{summary.topArea?.nama ?? '-'}</p><p className="mt-1 text-xs text-muted-foreground">{summary.topArea ? formatRupiah(summary.topArea.totalTerkumpul) : '-'}</p></div>
                  <div className="rounded-2xl border border-border/40 bg-background/60 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Kotak Aktif</p><p className="mt-2 text-sm font-semibold">{summary.totalKotakAktif.toLocaleString('id-ID')}</p><p className="mt-1 text-xs text-muted-foreground">tersebar di seluruh wilayah</p></div>
                  <div className="rounded-2xl border border-border/40 bg-background/60 p-4"><p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Healthiest</p><p className="mt-2 text-sm font-semibold">{summary.healthiest?.nama ?? '-'}</p><p className="mt-1 text-xs text-muted-foreground">skor kesehatan {summary.healthiest?.healthScore ?? 0}</p></div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-border/40 bg-background/60 p-4 transition-all duration-300 hover:border-white/10 hover:shadow-[0_14px_32px_rgba(0,0,0,0.12)]">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Total Penghimpunan</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">{formatRupiah(summary.totalCollected)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">akumulasi dari seluruh kecamatan terdata</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-background/60 p-4 transition-all duration-300 hover:border-white/10 hover:shadow-[0_14px_32px_rgba(0,0,0,0.12)]">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Jumlah Wilayah</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">{summary.total}</p>
                  <p className="mt-2 text-xs text-muted-foreground">kecamatan aktif dalam monitoring dashboard</p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-background/60 p-4 transition-all duration-300 hover:border-white/10 hover:shadow-[0_14px_32px_rgba(0,0,0,0.12)]">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/75">Pending Transaksi</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">{summary.pendingTransactions}</p>
                  <p className="mt-2 text-xs text-muted-foreground">butuh follow-up di level wilayah</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-border/40 bg-card/90 shadow-sm backdrop-blur-sm"><CardContent className="flex items-center gap-4 p-4"><div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10"><MapPin className="size-5 text-emerald-600" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Kecamatan</p><p className="text-xl font-bold">{summary.total}</p></div></CardContent></Card>
        <Card className="border border-border/40 bg-card/90 shadow-sm backdrop-blur-sm"><CardContent className="flex items-center gap-4 p-4"><div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10"><Users className="size-5 text-blue-600" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kotak Aktif</p><p className="text-xl font-bold">{summary.totalKotakAktif.toLocaleString('id-ID')}</p></div></CardContent></Card>
        <Card className="border border-border/40 bg-card/90 shadow-sm backdrop-blur-sm"><CardContent className="flex items-center gap-4 p-4"><div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10"><Coins className="size-5 text-amber-600" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Koin</p><p className="text-xl font-bold">{formatRupiah(summary.totalCollected)}</p></div></CardContent></Card>
         <Card className="border border-border/40 bg-card/90 shadow-sm backdrop-blur-sm"><CardContent className="flex items-center gap-4 p-4"><div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10"><TriangleAlert className="size-5 text-red-600" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Follow-up</p><p className="text-xl font-bold">{summary.underperforming}</p></div></CardContent></Card>
       </div>

      <Card className="border border-border/40 bg-card/90 shadow-sm backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Cari kecamatan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <div className="flex items-center gap-3">
              <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="Urutkan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Top Penghimpunan</SelectItem>
                  <SelectItem value="aktif">Aktivasi Tertinggi</SelectItem>
                  <SelectItem value="health">Skor Kesehatan</SelectItem>
                  <SelectItem value="nama">Nama A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRows.map((kec) => (
              <Card key={kec.id} className="group border border-border/40 bg-background/50 shadow-sm transition-all duration-300 hover:border-white/10 hover:shadow-[0_16px_36px_rgba(0,0,0,0.14)]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg transition-colors group-hover:text-emerald-600">{kec.nama}</CardTitle>
                      <Badge variant="secondary" className="font-normal">{kec.rantingCount} Ranting • {kec.jumlahDesa} Desa</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setSelected(kec)}>
                      <ArrowUpRight className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-3" /><span>Munfiq</span></div><p className="text-sm font-semibold">{kec.munfiqCount.toLocaleString('id-ID')}</p></div>
                    <div className="space-y-1"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Coins className="size-3" /><span>Total Koin</span></div><p className="text-sm font-semibold text-emerald-600">{formatRupiah(kec.totalKoin)}</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/40 bg-muted/20 p-3 text-xs">
                    <div><p className="text-muted-foreground">Skor</p><p className="mt-1 font-semibold">{kec.healthScore}</p></div>
                    <div><p className="text-muted-foreground">PLPK Aktif</p><p className="mt-1 font-semibold">{kec.activePlpkCount}</p></div>
                    <div><p className="text-muted-foreground">Pending</p><p className="mt-1 font-semibold">{kec.pendingTransactions}</p></div>
                  </div>
                  <div className="space-y-2"><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Aktivasi Kotak</span><span>{kec.activationRate}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', kec.activationRate >= 90 ? 'bg-emerald-500' : kec.activationRate >= 80 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${kec.activationRate}%` }} /></div></div>
                  <div className="border-t border-border/50 pt-2"><Button variant="outline" className="h-8 w-full gap-2 text-xs" onClick={() => setSelected(kec)}>Lihat Detail Wilayah<MoreHorizontal className="size-3" /></Button></div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredRows.length === 0 && <div className="py-12 text-center"><MapPin className="mx-auto mb-3 size-12 text-muted-foreground/50" /><p className="text-muted-foreground">Tidak ada kecamatan yang ditemukan</p><p className="text-sm text-muted-foreground/70">Coba ubah kata kunci pencarian atau urutan data</p></div>}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.nama}</DialogTitle>
                <DialogDescription>Ringkasan wilayah untuk evaluasi performa dan aktivasi lapangan.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-muted-foreground text-sm">Total Kotak</p><p className="font-semibold">{selected.jumlahKotak}</p></div>
                  <div><p className="text-muted-foreground text-sm">Kotak Aktif</p><p className="font-semibold">{selected.jumlahKotakAktif}</p></div>
                  <div><p className="text-muted-foreground text-sm">Munfiq</p><p className="font-semibold">{selected.munfiqCount.toLocaleString('id-ID')}</p></div>
                  <div><p className="text-muted-foreground text-sm">Ranting</p><p className="font-semibold">{selected.rantingCount}</p></div>
                  <div><p className="text-muted-foreground text-sm">PLPK Aktif</p><p className="font-semibold">{selected.activePlpkCount}</p></div>
                  <div><p className="text-muted-foreground text-sm">Pending Transaksi</p><p className="font-semibold">{selected.pendingTransactions}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground text-sm">Total Terkumpul</p><p className="text-lg font-semibold text-emerald-600">{formatRupiah(selected.totalTerkumpul)}</p></div>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Aktivasi Wilayah</span><span className="font-semibold">{selected.activationRate}%</span></div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', selected.activationRate >= 90 ? 'bg-emerald-500' : selected.activationRate >= 80 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${selected.activationRate}%` }} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-muted/20 p-4 text-sm">
                  <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-600" /><span>Skor kesehatan {selected.healthScore}</span></div>
                  <div className="flex items-center gap-2"><Clock3 className="size-4 text-blue-600" /><span>{selected.lastActivity ? formatDateShort(selected.lastActivity) : 'Belum ada aktivitas'}</span></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" asChild><Link href="/gorut/ranting">Lihat Ranting</Link></Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" asChild><Link href="/gorut/munfiq">Buka Data Munfiq</Link></Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
