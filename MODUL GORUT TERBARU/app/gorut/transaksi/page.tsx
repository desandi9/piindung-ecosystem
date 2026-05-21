'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Download } from 'lucide-react'
import { formatRupiah } from '@/lib/gorut/data'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { gocapPeriods } from '@/lib/gorut/penghimpunan-dummy'
import { useGorutMunfiqPlpkRows } from '@/lib/gorut/penghimpunan-control'

export default function TransaksiPage() {
  const rows = useGorutMunfiqPlpkRows()
  const [upzisFilter, setUpzisFilter] = useState('semua')
  const [rantingFilter, setRantingFilter] = useState('semua')
  const [plpkFilter, setPlpkFilter] = useState('semua')
  const [periodeFilter, setPeriodeFilter] = useState('Oktober 2025')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState('5')

  const upzisOptions = useMemo(() => ['semua', ...Array.from(new Set(rows.map((item) => item.upzis)))], [rows])
  const rantingOptions = useMemo(() => ['semua', ...Array.from(new Set(rows.map((item) => item.ranting)))], [rows])
  const plpkOptions = useMemo(() => ['semua', ...Array.from(new Set(rows.map((item) => `${item.plpkCode} | ${item.plpkName}`)))], [rows])

  const filteredRows = useMemo(
    () => rows.filter((item) => {
      const haystack = [item.kodeMunfiq, item.nama, item.alamat, item.noHp].join(' ').toLowerCase()
      return (upzisFilter === 'semua' || item.upzis === upzisFilter) &&
        (rantingFilter === 'semua' || item.ranting === rantingFilter) &&
        (plpkFilter === 'semua' || `${item.plpkCode} | ${item.plpkName}` === plpkFilter) &&
        item.periode === periodeFilter &&
        haystack.includes(search.toLowerCase())
    }),
    [periodeFilter, plpkFilter, rantingFilter, rows, search, upzisFilter]
  )

  const summary = useMemo(
    () => ({
      plpk: filteredRows[0] ? `${filteredRows[0].plpkCode} - ${filteredRows[0].plpkName}` : '-',
      aktif: filteredRows.length,
      terjemput: filteredRows.filter((item) => item.status === 'Terverifikasi').length,
      perolehan: filteredRows.filter((item) => item.status === 'Terverifikasi').reduce((sum, item) => sum + item.koinTerjemput, 0),
    }),
    [filteredRows]
  )

  const visibleRows = useMemo(() => filteredRows.slice(0, Number(pageSize)), [filteredRows, pageSize])

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      exportReportToPdf({
        title: 'Penghimpunan Munfiq - PLPK',
        subtitle: `${filteredRows.length} data periode ${periodeFilter}`,
        summary: [
          { label: 'PLPK', value: summary.plpk },
          { label: 'Munfiq Aktif', value: String(summary.aktif) },
          { label: 'Munfiq Terjemput', value: String(summary.terjemput) },
          { label: 'Perolehan', value: formatRupiah(summary.perolehan) },
        ],
        tables: [{
          title: 'Daftar Penjemputan Munfiq',
          columns: ['Kode Munfiq', 'Nama', 'Ranting', 'Tanggal Jemput', 'Periode', 'Koin', 'Status'],
          rows: filteredRows.map((item) => [item.kodeMunfiq, item.nama, item.ranting, item.tanggalJemput ?? '-', item.periode, formatRupiah(item.koinTerjemput), item.status]),
        }],
      })
      return
    }

    exportRowsToSpreadsheet({
      fileName: `munfiq-plpk-${new Date().toISOString().slice(0, 10)}.xlsx`,
      rows: [
        ['Kode Munfiq', 'Nama', 'Ranting', 'PLPK', 'Tanggal Jemput', 'Periode', 'Koin Terjemput', 'Status'],
        ...filteredRows.map((item) => [item.kodeMunfiq, item.nama, item.ranting, `${item.plpkCode} - ${item.plpkName}`, item.tanggalJemput ?? '', item.periode, String(item.koinTerjemput), item.status]),
      ],
      format: 'xlsx',
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 text-center lg:text-left">
          <h1 className="text-4xl font-black tracking-tight">MUNFIQ - PLPK</h1>
          <p className="text-xl font-bold">Penjemputan Infaq Munfiq oleh PLPK</p>
        </div>

        <Card className="border border-border/40 bg-card/90">
          <CardContent className="grid gap-3 p-4 md:grid-cols-5">
            <Select value={upzisFilter} onValueChange={setUpzisFilter}><SelectTrigger><SelectValue placeholder="UPZIS" /></SelectTrigger><SelectContent>{upzisOptions.map((item) => <SelectItem key={item} value={item}>{item === 'semua' ? 'Semua UPZIS' : item}</SelectItem>)}</SelectContent></Select>
            <Select value={rantingFilter} onValueChange={setRantingFilter}><SelectTrigger><SelectValue placeholder="Ranting" /></SelectTrigger><SelectContent>{rantingOptions.map((item) => <SelectItem key={item} value={item}>{item === 'semua' ? 'Semua Ranting' : item}</SelectItem>)}</SelectContent></Select>
            <Select value={plpkFilter} onValueChange={setPlpkFilter}><SelectTrigger><SelectValue placeholder="PLPK" /></SelectTrigger><SelectContent>{plpkOptions.map((item) => <SelectItem key={item} value={item}>{item === 'semua' ? 'Semua PLPK' : item}</SelectItem>)}</SelectContent></Select>
            <Select value={periodeFilter} onValueChange={setPeriodeFilter}><SelectTrigger><SelectValue placeholder="Periode" /></SelectTrigger><SelectContent>{gocapPeriods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Cari munfiq..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PLPK</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.plpk}</p></CardContent></Card>
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Munfiq Aktif</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.aktif} Munfiq</p></CardContent></Card>
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Munfiq Terjemput</p><p className="mt-2 text-2xl font-black text-emerald-600">{summary.terjemput} Munfiq</p></CardContent></Card>
          <Card className="border border-border/40"><CardContent className="border-l-4 border-emerald-500 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Perolehan (Terverifikasi)</p><p className="mt-2 text-2xl font-black text-emerald-600">{formatRupiah(summary.perolehan)}</p></CardContent></Card>
        </div>
      </div>

      <Card className="border border-border/40 bg-card/90">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm"><span className="font-medium">Show</span><Select value={pageSize} onValueChange={setPageSize}><SelectTrigger className="h-9 w-[72px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent></Select></div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><Button variant="outline" size="sm" className="gap-2" onClick={() => handleExport('pdf')}><Download className="size-4" />Export</Button><div className="relative min-w-[240px]"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Cari munfiq..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Munfiq</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Tgl. Jemput</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Koin Terjemput</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell><div><p className="font-medium">{item.kodeMunfiq} - {item.nama}</p><p className="text-xs text-muted-foreground">{item.noHp}</p></div></TableCell>
                    <TableCell>{item.alamat}</TableCell>
                    <TableCell>{item.tanggalJemput ?? '-'}</TableCell>
                    <TableCell>{item.periode}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(item.koinTerjemput)}</TableCell>
                    <TableCell className="text-right"><span className={item.status === 'Terverifikasi' ? 'text-emerald-600' : 'text-red-500'}>{item.status}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
