'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { EmptyState, MetricCard, PageSectionHeader } from '@/components/ui/ds-patterns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Download, Loader2, Save, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'
import { formatRupiah } from '@/lib/gorut/data'
import { exportReportToPdf, exportRowsToSpreadsheet } from '@/lib/gorut/export'
import { gocapPeriods } from '@/lib/gorut/penghimpunan-dummy'
import { useGorutMunfiqPlpkRows } from '@/lib/gorut/penghimpunan-control'
import type { PlpkDashboardPayload, PlpkDashboardTransaction } from '@/lib/gorut/plpk-dashboard-control'
import { getGorutTransactionStateClassName, getGorutTransactionStateLabel } from '@/lib/gorut/workflow-status'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPeriodLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date)
}

function PlpkTransaksiPage() {
  const { toast } = useToast()
  const [payload, setPayload] = useState<PlpkDashboardPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedMunfiqId, setSelectedMunfiqId] = useState('')
  const [amount, setAmount] = useState('')
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [sourceChannel, setSourceChannel] = useState('tunai')
  const [notes, setNotes] = useState('')
  const [confirmSubmit, setConfirmSubmit] = useState<{ type: 'new' } | { type: 'draft'; transaction: PlpkDashboardTransaction } | null>(null)

  const loadPayload = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gorut/plpk-dashboard', { cache: 'no-store' })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error ?? 'Gagal membaca data PLPK.')
      setPayload(body as PlpkDashboardPayload)
    } catch (error) {
      toast({ variant: 'destructive', title: 'Data gagal dimuat', description: error instanceof Error ? error.message : 'Gagal membaca data PLPK.' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPayload()
  }, [])

  const munfiqRows = payload?.munfiq ?? []
  const transactions = payload?.transactions ?? []
  const selectedMunfiq = munfiqRows.find((item) => item.id === selectedMunfiqId)
  const amountNumber = Number(amount)
  const totalAmount = Number.isFinite(amountNumber) ? amountNumber : 0

  const openSubmitConfirmation = () => {
    if (!selectedMunfiqId) {
      toast({ variant: 'destructive', title: 'Munfiq belum dipilih', description: 'Pilih Munfiq yang akan disetorkan.' })
      return
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      toast({ variant: 'destructive', title: 'Nominal belum valid', description: 'Isi nominal setoran lebih dari 0.' })
      return
    }

    setConfirmSubmit({ type: 'new' })
  }

  const applySubmitConfirmation = () => {
    if (!confirmSubmit) return
    if (confirmSubmit.type === 'new') void handleSave(true)
    else void handleSubmitDraft(confirmSubmit.transaction)
    setConfirmSubmit(null)
  }

  const handleSave = async (submit: boolean) => {
    if (!selectedMunfiqId) {
      toast({ variant: 'destructive', title: 'Munfiq belum dipilih', description: 'Pilih Munfiq yang akan disetorkan.' })
      return
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      toast({ variant: 'destructive', title: 'Nominal belum valid', description: 'Isi nominal setoran lebih dari 0.' })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/gorut/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionDate,
          sourceChannel,
          notes: notes.trim() || null,
          submit,
          items: [{
            gorutMunfiqId: selectedMunfiqId,
            amount: totalAmount,
            periodLabel: formatPeriodLabel(transactionDate),
            notes: notes.trim() || null,
          }],
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error ?? 'Gagal menyimpan setoran.')

      toast({
        title: submit ? 'Setoran dikirim' : 'Draft tersimpan',
        description: submit ? 'Setoran masuk ke verifikasi Ranting.' : 'Draft setoran tersimpan dan dapat disubmit dari riwayat.',
      })
      setSelectedMunfiqId('')
      setAmount('')
      setNotes('')
      await loadPayload()
    } catch (error) {
      toast({ variant: 'destructive', title: 'Setoran gagal disimpan', description: error instanceof Error ? error.message : 'Gagal menyimpan setoran.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitDraft = async (transaction: PlpkDashboardTransaction) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/gorut/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transaction.id, action: 'submit', notes: 'Submit setoran dari web fallback PLPK.' }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error ?? 'Gagal submit draft.')
      toast({ title: 'Draft disubmit', description: 'Setoran menunggu verifikasi sesuai alur operasional.' })
      await loadPayload()
    } catch (error) {
      toast({ variant: 'destructive', title: 'Submit gagal', description: error instanceof Error ? error.message : 'Gagal submit draft.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Memuat data setoran PLPK...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageSectionHeader title={<h1 className="text-2xl font-bold tracking-tight">Input Setoran PLPK</h1>} description="Setoran menunggu verifikasi sesuai alur operasional." />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Input Setoran Baru</CardTitle>
            <CardDescription>{payload?.profile.plpk ? `${payload.profile.plpk.code} - ${payload.profile.plpk.name}` : 'Scope PLPK Anda'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Munfiq</Label>
              <Select value={selectedMunfiqId} onValueChange={setSelectedMunfiqId}>
                <SelectTrigger><SelectValue placeholder="Pilih Munfiq" /></SelectTrigger>
                <SelectContent>
                  {munfiqRows.map((item) => <SelectItem key={item.id} value={item.id}>{item.munfiqCode} - {item.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedMunfiq ? <p className="text-xs text-muted-foreground">{selectedMunfiq.address ?? '-'} • {selectedMunfiq.phone ?? '-'}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Tanggal Setoran</Label><Input type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} /></div>
              <div className="space-y-2"><Label>Metode</Label><Select value={sourceChannel} onValueChange={setSourceChannel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tunai">Tunai</SelectItem><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="qris">QRIS</SelectItem></SelectContent></Select></div>
            </div>

            <div className="space-y-2">
              <Label>Nominal Setoran</Label>
              <Input type="number" min="0" inputMode="numeric" placeholder="Contoh: 50000" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea rows={3} placeholder="Opsional" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>

            <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Total Setoran</span>
                <span className="text-lg font-bold text-emerald-600">{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="gap-2" disabled={isSaving} onClick={() => handleSave(false)}><Save className="size-4" />Simpan Draft</Button>
              <Button type="button" className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={isSaving} onClick={openSubmitConfirmation}><Send className="size-4" />Submit Setoran</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
            <CardDescription>Data dalam scope PLPK aktif.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <MetricCard title="Munfiq Saya" value={payload?.summary.totalMunfiq ?? 0} icon={Search} accent="from-blue-500/15 via-blue-500/5 to-transparent" iconTone="bg-blue-500/10 text-blue-600" />
            <MetricCard title="Pending" value={payload?.summary.transaksiPending ?? 0} icon={Loader2} accent="from-amber-500/15 via-amber-500/5 to-transparent" iconTone="bg-amber-500/10 text-amber-600" />
            <MetricCard title="Selesai" value={payload?.summary.transaksiSelesai ?? 0} icon={Send} accent="from-emerald-500/15 via-emerald-500/5 to-transparent" iconTone="bg-emerald-500/10 text-emerald-600" />
            <MetricCard title="Setoran Bulan Ini" value={formatRupiah(payload?.summary.setoranBulanIni ?? 0)} icon={Download} accent="from-violet-500/15 via-violet-500/5 to-transparent" iconTone="bg-violet-500/10 text-violet-600" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Riwayat Setoran</CardTitle>
          <CardDescription>Draft dan transaksi yang dibuat oleh PLPK sesuai scope assignment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        inline
                        icon={Loader2}
                        title="Belum ada setoran"
                        description="Simpan draft atau submit setoran pertama dari form di atas."
                      />
                    </TableCell>
                  </TableRow>
                ) : transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.transactionCode}</TableCell>
                    <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(transaction.totalAmount)}</TableCell>
                    <TableCell><Badge variant="outline" className={getGorutTransactionStateClassName(transaction.currentState)}>{getGorutTransactionStateLabel(transaction.currentState)}</Badge></TableCell>
                    <TableCell className="text-right">{transaction.currentState === 'DRAFT' ? <Button size="sm" variant="outline" disabled={isSaving} onClick={() => setConfirmSubmit({ type: 'draft', transaction })}>Submit Setoran</Button> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(confirmSubmit)} onOpenChange={(open) => !open && setConfirmSubmit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Submit Setoran</DialogTitle>
            <DialogDescription>
              Setoran akan dikirim ke Verifikasi Ranting dan tidak lagi berada di draft PLPK. Pastikan Munfiq dan nominal sudah benar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmit(null)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={isSaving} onClick={applySubmitConfirmation}>Ya, Submit Setoran</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OperationalTransaksiPage() {
  const rows = useGorutMunfiqPlpkRows()
  const [upzisFilter, setUpzisFilter] = useState('semua')
  const [rantingFilter, setRantingFilter] = useState('semua')
  const [plpkFilter, setPlpkFilter] = useState('semua')
  const [periodeFilter, setPeriodeFilter] = useState('semua')
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState('5')

  const upzisOptions = useMemo(() => ['semua', ...Array.from(new Set(rows.map((item) => item.upzis)))], [rows])
  const rantingOptions = useMemo(() => ['semua', ...Array.from(new Set(rows.map((item) => item.ranting)))], [rows])
  const plpkOptions = useMemo(() => ['semua', ...Array.from(new Set(rows.map((item) => `${item.plpkCode} | ${item.plpkName}`)))], [rows])
  const periodeOptions = useMemo(() => ['semua', ...Array.from(new Set([...gocapPeriods, ...rows.map((item) => item.periode)]))], [rows])

  const filteredRows = useMemo(
    () => rows.filter((item) => {
      const haystack = [item.kodeMunfiq, item.nama, item.alamat, item.noHp].join(' ').toLowerCase()
      return (upzisFilter === 'semua' || item.upzis === upzisFilter) &&
        (rantingFilter === 'semua' || item.ranting === rantingFilter) &&
        (plpkFilter === 'semua' || `${item.plpkCode} | ${item.plpkName}` === plpkFilter) &&
        (periodeFilter === 'semua' || item.periode === periodeFilter) &&
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
      <PageSectionHeader
        title={<h1 className="text-2xl font-bold tracking-tight">MUNFIQ - PLPK</h1>}
        description="Penjemputan Infaq Munfiq oleh PLPK. Data diambil dari database GORUT."
      />

        <Card className="border border-border/60 bg-card/90 shadow-sm">
          <CardContent className="grid gap-3 p-4 md:grid-cols-5">
            <Select value={upzisFilter} onValueChange={setUpzisFilter}>
              <SelectTrigger aria-label="Filter UPZIS"><SelectValue placeholder="UPZIS" /></SelectTrigger>
              <SelectContent>{upzisOptions.map((item) => <SelectItem key={item} value={item}>{item === 'semua' ? 'Semua UPZIS' : item}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={rantingFilter} onValueChange={setRantingFilter}>
              <SelectTrigger aria-label="Filter Ranting"><SelectValue placeholder="Ranting" /></SelectTrigger>
              <SelectContent>{rantingOptions.map((item) => <SelectItem key={item} value={item}>{item === 'semua' ? 'Semua Ranting' : item}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={plpkFilter} onValueChange={setPlpkFilter}>
              <SelectTrigger aria-label="Filter PLPK"><SelectValue placeholder="PLPK" /></SelectTrigger>
              <SelectContent>{plpkOptions.map((item) => <SelectItem key={item} value={item}>{item === 'semua' ? 'Semua PLPK' : item}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
              <SelectTrigger aria-label="Filter Periode"><SelectValue placeholder="Periode" /></SelectTrigger>
              <SelectContent>{periodeOptions.map((item) => <SelectItem key={item} value={item}>{item === 'semua' ? 'Semua Periode' : item}</SelectItem>)}</SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari munfiq..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Cari munfiq" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="PLPK" value={summary.plpk} icon={Search} accent="from-emerald-500/15 via-emerald-500/5 to-transparent" iconTone="bg-emerald-500/10 text-emerald-600" />
          <MetricCard title="Munfiq Aktif" value={`${summary.aktif} Munfiq`} icon={Search} accent="from-blue-500/15 via-blue-500/5 to-transparent" iconTone="bg-blue-500/10 text-blue-600" />
          <MetricCard title="Munfiq Terjemput" value={`${summary.terjemput} Munfiq`} icon={Search} accent="from-indigo-500/15 via-indigo-500/5 to-transparent" iconTone="bg-indigo-500/10 text-indigo-600" />
          <MetricCard title="Perolehan" value={formatRupiah(summary.perolehan)} icon={Search} accent="from-violet-500/15 via-violet-500/5 to-transparent" iconTone="bg-violet-500/10 text-violet-600" />
        </div>

      <Card className="border border-border/60 bg-card/90">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Show</span>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="h-9 w-[72px]" aria-label="Jumlah baris per halaman"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="outline" size="sm" className="min-h-9 gap-2" onClick={() => handleExport('pdf')} aria-label="Export transaksi ke PDF"><Download className="size-4" />Export PDF</Button>
              <Button variant="outline" size="sm" className="min-h-9 gap-2" onClick={() => handleExport('excel')} aria-label="Export transaksi ke Excel"><Download className="size-4" />Export Excel</Button>
            </div>
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
                {visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <EmptyState
                        inline
                        icon={Loader2}
                        title="Belum ada data setoran"
                        description="Ubah filter atau tunggu setoran masuk dari alur PLPK."
                      />
                    </TableCell>
                  </TableRow>
                ) : visibleRows.map((item, index) => (
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

export default function TransaksiPage() {
  const { user, isLoading } = useAuth()

  if (!isLoading && user?.role === 'plpk') {
    return <PlpkTransaksiPage />
  }

  return <OperationalTransaksiPage />
}
