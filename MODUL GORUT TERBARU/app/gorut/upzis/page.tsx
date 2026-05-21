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
import { calculateAverage, calculatePercentage, gocapPeriods } from '@/lib/gorut/penghimpunan-dummy'
import { useGorutKordesUpzisRows, useGorutUpzisPcRows } from '@/lib/gorut/penghimpunan-control'

export default function UpzisPage() {
  const rows = useGorutUpzisPcRows()
  const sourceKordesRows = useGorutKordesUpzisRows()
  const [periodeFilter, setPeriodeFilter] = useState('Oktober 2025')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState('5')

  const filteredRows = useMemo(
    () => rows.filter((item) => item.periode === periodeFilter && [item.upzisCode, item.upzis].join(' ').toLowerCase().includes(search.toLowerCase())),
    [periodeFilter, rows, search]
  )

  const summary = useMemo(
    () => ({
      totalUpzis: filteredRows.filter((item) => sourceKordesRows.some((source) => source.upzis === item.upzis && source.status === 'Terverifikasi UPZIS')).length,
      aktif: filteredRows.filter((item) => sourceKordesRows.some((source) => source.upzis === item.upzis && source.status === 'Terverifikasi UPZIS')).reduce((sum, item) => sum + item.aktif, 0),
      terjemput: filteredRows.filter((item) => sourceKordesRows.some((source) => source.upzis === item.upzis && source.status === 'Terverifikasi UPZIS')).reduce((sum, item) => sum + item.terjemput, 0),
      perolehan: filteredRows.filter((item) => sourceKordesRows.some((source) => source.upzis === item.upzis && source.status === 'Terverifikasi UPZIS')).reduce((sum, item) => sum + item.koinTerjemput, 0),
    }),
    [filteredRows, sourceKordesRows]
  )

  const visibleRows = useMemo(() => filteredRows.slice(0, Number(pageSize)), [filteredRows, pageSize])

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      exportReportToPdf({
        title: 'Penghimpunan UPZIS - PC',
        subtitle: `${filteredRows.length} data periode ${periodeFilter}`,
        summary: [
          { label: 'Total UPZIS', value: String(summary.totalUpzis) },
          { label: 'Munfiq Aktif', value: String(summary.aktif) },
          { label: 'Munfiq Terjemput', value: String(summary.terjemput) },
          { label: 'Koin Terjemput', value: formatRupiah(summary.perolehan) },
        ],
        tables: [{
          title: 'Daftar UPZIS ke PC',
          columns: ['UPZIS', 'Aktif', 'Terjemput', 'Prosentase', 'Koin Terjemput'],
          rows: filteredRows.map((item) => [item.upzis, String(item.aktif), String(item.terjemput), `${calculatePercentage(item.terjemput, item.aktif).toFixed(2)}%`, formatRupiah(item.koinTerjemput)]),
        }],
      })
      return
    }

    exportRowsToSpreadsheet({
      fileName: `upzis-pc-${new Date().toISOString().slice(0, 10)}.xlsx`,
      rows: [
        ['UPZIS', 'Aktif', 'Terjemput', 'Prosentase', 'Koin Terjemput'],
        ...filteredRows.map((item) => [item.upzis, String(item.aktif), String(item.terjemput), String(calculatePercentage(item.terjemput, item.aktif).toFixed(2)), String(item.koinTerjemput)]),
      ],
      format: 'xlsx',
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 text-center lg:text-left">
          <h1 className="text-4xl font-black tracking-tight">UPZIS - PC</h1>
          <p className="text-xl font-bold">Penghimpunan Koin dari UPZIS ke PC</p>
        </div>

        <Card className="border border-border/40 bg-card/90">
          <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Periode" />
            </SelectTrigger>
            <SelectContent>
              {gocapPeriods.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Cari UPZIS..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total UPZIS</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.totalUpzis} UPZIS</p></CardContent></Card>
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Munfiq Aktif</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.aktif.toLocaleString('id-ID')}</p></CardContent></Card>
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Munfiq Terjemput</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.terjemput.toLocaleString('id-ID')}</p></CardContent></Card>
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Koin Terjemput</p><p className="mt-2 text-2xl font-black text-emerald-600">{formatRupiah(summary.perolehan)}</p></CardContent></Card>
        </div>
      </div>

      <Card className="border border-border/40 bg-card/90">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm"><span className="font-medium">Show</span><Select value={pageSize} onValueChange={setPageSize}><SelectTrigger className="h-9 w-[72px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent></Select></div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('pdf')}><Download className="size-4" />Export</Button><Button asChild variant="outline" size="sm"><Link href="/gorut/validasi">Buka Verifikasi</Link></Button><div className="relative min-w-[240px]"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Cari UPZIS..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
          </div>

          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>UPZIS</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">Aktif</TableHead>
                <TableHead className="text-right">Terjemput</TableHead>
                <TableHead className="text-right">Prosentase</TableHead>
                <TableHead className="text-right">Koin Terjemput</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((item, index) => {
                const prosentase = calculatePercentage(item.terjemput, item.aktif)
                const rataRata = calculateAverage(item.koinTerjemput, item.terjemput)

                return (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.upzis}</p>
                        <p className="text-xs text-muted-foreground">{item.upzisCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{item.periode}</p>
                        <p className="text-xs text-muted-foreground">Verifikasi via menu Verifikasi</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.aktif.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">{item.terjemput.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right">{prosentase.toFixed(2)}%</TableCell>
                    <TableCell className="text-right"><p className="font-medium">{formatRupiah(item.koinTerjemput)}</p><p className="text-xs text-muted-foreground">Rata2: {formatRupiah(rataRata)}</p></TableCell>
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
