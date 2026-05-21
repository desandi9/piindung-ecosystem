'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Download } from 'lucide-react'
import { formatRupiah } from '@/lib/gorut/data'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { calculateAverage, calculatePercentage, calculatePlpkBisyaroh, gocapPeriods } from '@/lib/gorut/penghimpunan-dummy'
import { useGorutPlpkKordesRows } from '@/lib/gorut/penghimpunan-control'

export default function MonitoringPLPKPage() {
  const rows = useGorutPlpkKordesRows()
  const [upzisFilter, setUpzisFilter] = useState('semua')
  const [rantingFilter, setRantingFilter] = useState('semua')
  const [periodeFilter, setPeriodeFilter] = useState('Oktober 2025')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState('5')

  const upzisOptions = useMemo(() => ['semua', ...Array.from(new Set(rows.map((item) => item.upzis)))], [rows])
  const rantingOptions = useMemo(() => ['semua', ...Array.from(new Set(rows.map((item) => item.ranting)))], [rows])

  const filteredRows = useMemo(
    () =>
      rows.filter((item) => {
        const haystack = [item.plpkCode, item.plpkName, item.ranting, item.kordes, item.upzis].join(' ').toLowerCase()
        return (upzisFilter === 'semua' || item.upzis === upzisFilter) &&
          (rantingFilter === 'semua' || item.ranting === rantingFilter) &&
          item.periode === periodeFilter &&
          haystack.includes(search.toLowerCase())
      }),
    [periodeFilter, rantingFilter, rows, search, upzisFilter]
  )

  const summary = useMemo(
    () => ({
      koordinator: filteredRows[0]?.kordes ?? '-',
      aktif: filteredRows.length,
      menjemput: filteredRows.filter((item) => item.terjemput > 0).length,
      perolehan: filteredRows.reduce((sum, item) => sum + item.koinTerjemput, 0),
    }),
    [filteredRows]
  )

  const visibleRows = useMemo(() => filteredRows.slice(0, Number(pageSize)), [filteredRows, pageSize])

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      exportReportToPdf({
        title: 'Penghimpunan PLPK - Kordes',
        subtitle: `${filteredRows.length} data periode ${periodeFilter}`,
        summary: [
          { label: 'Koordinator', value: summary.koordinator },
          { label: 'PLPK Aktif', value: String(summary.aktif) },
          { label: 'PLPK Menjemput', value: String(summary.menjemput) },
          { label: 'Perolehan', value: formatRupiah(summary.perolehan) },
        ],
        tables: [{
          title: 'Daftar Verifikasi PLPK',
          columns: ['PLPK', 'Ranting', 'Aktif', 'Terjemput', 'Prosentase', 'Koin', 'Bisyaroh'],
          rows: filteredRows.map((item) => [item.plpkCode, item.ranting, String(item.aktif), String(item.terjemput), `${calculatePercentage(item.terjemput, item.aktif).toFixed(2)}%`, formatRupiah(item.koinTerjemput), formatRupiah(calculatePlpkBisyaroh(item.terjemput))]),
        }],
      })
      return
    }

    exportRowsToSpreadsheet({
      fileName: `plpk-kordes-${new Date().toISOString().slice(0, 10)}.xlsx`,
      rows: [
        ['PLPK', 'Ranting', 'Aktif', 'Terjemput', 'Prosentase', 'Koin Terjemput', 'Bisyaroh'],
        ...filteredRows.map((item) => [item.plpkCode, item.ranting, String(item.aktif), String(item.terjemput), String(calculatePercentage(item.terjemput, item.aktif).toFixed(2)), String(item.koinTerjemput), String(calculatePlpkBisyaroh(item.terjemput))]),
      ],
      format: 'xlsx',
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 text-center lg:text-left">
          <h1 className="text-4xl font-black tracking-tight">PLPK - KORDES</h1>
          <p className="text-xl font-bold">Penghimpunan Infaq dari PLPK ke Kordes (Verifikasi)</p>
        </div>

        <Card className="border border-border/40 bg-card/90">
          <CardContent className="grid gap-3 p-4 md:grid-cols-3">
            <Select value={upzisFilter} onValueChange={setUpzisFilter}><SelectTrigger><SelectValue placeholder="UPZIS" /></SelectTrigger><SelectContent>{upzisOptions.map((item) => <SelectItem key={item} value={item}>{item === 'semua' ? 'Semua UPZIS' : item}</SelectItem>)}</SelectContent></Select>
            <Select value={rantingFilter} onValueChange={setRantingFilter}><SelectTrigger><SelectValue placeholder="Ranting" /></SelectTrigger><SelectContent>{rantingOptions.map((item) => <SelectItem key={item} value={item}>{item === 'semua' ? 'Semua Ranting' : item}</SelectItem>)}</SelectContent></Select>
            <Select value={periodeFilter} onValueChange={setPeriodeFilter}><SelectTrigger><SelectValue placeholder="Periode" /></SelectTrigger><SelectContent>{gocapPeriods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Koordinator</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.koordinator}</p></CardContent></Card>
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PLPK Aktif</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.aktif} PLPK</p></CardContent></Card>
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PLPK Menjemput</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.menjemput} PLPK</p></CardContent></Card>
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Perolehan</p><p className="mt-2 text-2xl font-black text-emerald-600">{formatRupiah(summary.perolehan)}</p></CardContent></Card>
        </div>
      </div>

      <Card className="border border-border/40 bg-card/90">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm"><span className="font-medium">Show</span><Select value={pageSize} onValueChange={setPageSize}><SelectTrigger className="h-9 w-[72px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent></Select></div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('pdf')}><Download className="size-4" />Export</Button><Button asChild variant="outline" size="sm"><Link href="/gorut/validasi">Buka Verifikasi</Link></Button><div className="relative min-w-[240px]"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Cari PLPK..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2}>No</TableHead>
                  <TableHead rowSpan={2}>PLPK</TableHead>
                  <TableHead rowSpan={2}>Periode</TableHead>
                  <TableHead colSpan={3} className="text-center">Munfiq</TableHead>
                  <TableHead rowSpan={2} className="text-right">Koin Terjemput</TableHead>
                  <TableHead rowSpan={2} className="text-right">Bisyaroh PLPK</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-right">Aktif</TableHead>
                  <TableHead className="text-right">Terjemput</TableHead>
                  <TableHead className="text-right">Prosentase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((item, index) => {
                  const prosentase = calculatePercentage(item.terjemput, item.aktif)
                  const rataRata = calculateAverage(item.koinTerjemput, item.terjemput)
                  const bisyaroh = calculatePlpkBisyaroh(item.terjemput)

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell><div><p className="font-medium">{item.plpkCode}</p><p className="text-xs text-muted-foreground">{item.plpkName}</p></div></TableCell>
                      <TableCell><div><p>{item.periode}</p><p className="text-xs text-muted-foreground">Verifikasi via menu Verifikasi</p></div></TableCell>
                      <TableCell className="text-right">{item.aktif}</TableCell>
                      <TableCell className="text-right">{item.terjemput}</TableCell>
                      <TableCell className="text-right">{prosentase.toFixed(2)}%</TableCell>
                      <TableCell className="text-right"><p className="font-medium">{formatRupiah(item.koinTerjemput)}</p><p className="text-xs text-muted-foreground">Rata2: {formatRupiah(rataRata)}</p></TableCell>
                      <TableCell className="text-right">{formatRupiah(bisyaroh)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
