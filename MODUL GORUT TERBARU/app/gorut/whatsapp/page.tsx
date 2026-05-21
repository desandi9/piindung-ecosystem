'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Bell,
  Megaphone,
  Edit,
  Eye,
  Copy,
  Wifi,
  WifiOff,
  Smartphone,
  Info,
  Download,
  Search,
} from 'lucide-react'
import { whatsappTemplates } from '@/lib/gorut/data'
import { exportReportToPdf } from '@/lib/gorut/export'
import { cn } from '@/lib/utils'

const templateTypeConfig = {
  setoran_berhasil: { label: 'Setoran Berhasil', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600' },
  validasi: { label: 'Validasi', icon: CheckCircle2, color: 'bg-blue-500/10 text-blue-600' },
  reminder: { label: 'Reminder', icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
  broadcast: { label: 'Broadcast', icon: Megaphone, color: 'bg-violet-500/10 text-violet-600' },
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Preview component that replaces variables with sample data
function MessagePreview({ content }: { content: string }) {
  const sampleData: Record<string, string> = {
    nama: 'Ahmad Sulaiman',
    nominal: 'Rp 1.250.000',
    kode: 'TRX-20260514-001',
    tanggal: '14 Mei 2026',
    validator: 'Admin PC',
    status: 'Berhasil',
    hari: '30',
    bulan: 'April 2026',
    total: 'Rp 185.400.000',
    munfiq: '1.247',
    kecamatan: '42',
  }

  let previewContent = content
  Object.entries(sampleData).forEach(([key, value]) => {
    previewContent = previewContent.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  })

  return (
    <div className="rounded-lg bg-[#075E54] p-4 text-white">
      <div className="rounded-lg bg-[#DCF8C6] p-3 text-gray-800 text-sm whitespace-pre-line max-w-[280px] ml-auto">
        {previewContent}
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500">
          <span>09:30</span>
          <CheckCircle2 className="size-3 text-blue-500" />
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState(whatsappTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof whatsappTemplates[0] | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [gatewayConnected, setGatewayConnected] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | keyof typeof templateTypeConfig>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    tipe: 'setoran_berhasil' as keyof typeof templateTypeConfig,
    konten: '',
    variabel: 'nama,nominal,kode,tanggal',
    aktif: true,
  })

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase()
    return templates.filter((template) => {
      const matchesType = typeFilter === 'all' || template.tipe === typeFilter
      const matchesSearch = !query || [template.nama, template.konten, template.tipe, template.variabel.join(' ')].join(' ').toLowerCase().includes(query)
      return matchesType && matchesSearch
    })
  }, [templates, search, typeFilter])

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter((item) => item.aktif).length,
    broadcast: templates.filter((item) => item.tipe === 'broadcast').length,
    inactive: templates.filter((item) => !item.aktif).length,
  }), [templates])

  const handleToggleTemplate = (id: string) => {
    const target = templates.find((item) => item.id === id)
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, aktif: !t.aktif } : t))
    toast({ variant: 'default', title: target?.aktif ? 'Template dinonaktifkan' : 'Template diaktifkan', description: 'Status template berhasil diperbarui.' })
  }

  const handlePreview = (template: typeof whatsappTemplates[0]) => {
    setSelectedTemplate(template)
    setPreviewOpen(true)
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({ nama: '', tipe: 'setoran_berhasil', konten: '', variabel: 'nama,nominal,kode,tanggal', aktif: true })
    setEditorOpen(true)
  }

  const openEdit = (template: typeof whatsappTemplates[0]) => {
    setEditingId(template.id)
    setFormData({ nama: template.nama, tipe: template.tipe, konten: template.konten, variabel: template.variabel.join(','), aktif: template.aktif })
    setEditorOpen(true)
  }

  const handleSaveTemplate = () => {
    if (!formData.nama.trim() || !formData.konten.trim()) {
      toast({ variant: 'destructive', title: 'Nama dan konten wajib diisi', description: 'Lengkapi template sebelum disimpan.' })
      return
    }

    const variabel = formData.variabel.split(',').map((item) => item.trim()).filter(Boolean)
    if (editingId) {
      setTemplates((prev) => prev.map((item) => item.id === editingId ? { ...item, nama: formData.nama.trim(), tipe: formData.tipe, konten: formData.konten.trim(), variabel, aktif: formData.aktif, updatedAt: new Date().toISOString() } : item))
      toast({ variant: 'default', title: 'Template diperbarui', description: `${formData.nama} berhasil diperbarui.` })
    } else {
      setTemplates((prev) => [{ id: `${Date.now()}`, nama: formData.nama.trim(), tipe: formData.tipe, konten: formData.konten.trim(), variabel, aktif: formData.aktif, updatedAt: new Date().toISOString() }, ...prev])
      toast({ variant: 'default', title: 'Template dibuat', description: `${formData.nama} berhasil ditambahkan.` })
    }
    setEditorOpen(false)
  }

  const handleDuplicate = (template: typeof whatsappTemplates[0]) => {
    setTemplates((prev) => [{ ...template, id: `${Date.now()}`, nama: `${template.nama} Copy`, aktif: false, updatedAt: new Date().toISOString() }, ...prev])
    toast({ variant: 'default', title: 'Template diduplikasi', description: `Salinan ${template.nama} berhasil dibuat.` })
  }

  const handleCopy = async (template: typeof whatsappTemplates[0]) => {
    await navigator.clipboard.writeText(template.konten)
    toast({ variant: 'default', title: 'Konten disalin', description: `Isi template ${template.nama} disalin ke clipboard.` })
  }

  const handleTestSend = (template?: typeof whatsappTemplates[0] | null) => {
    if (!gatewayConnected) return
    toast({ variant: 'default', title: 'Test kirim diproses', description: `${template?.nama ?? 'Template'} dikirim ke nomor simulasi gateway.` })
  }

  const handleExportPdf = () => {
    exportReportToPdf({
      title: 'Laporan Template WhatsApp GORUT',
      subtitle: `Total ${filteredTemplates.length} template sesuai filter aktif`,
      summary: [
        { label: 'Total Template', value: String(stats.total) },
        { label: 'Aktif', value: String(stats.active) },
        { label: 'Broadcast', value: String(stats.broadcast) },
        { label: 'Gateway', value: gatewayConnected ? 'Terhubung' : 'Terputus' },
      ],
      tables: [{
        title: 'Daftar Template',
        columns: ['Nama', 'Tipe', 'Aktif', 'Variabel', 'Updated'],
        rows: filteredTemplates.map((item) => [item.nama, templateTypeConfig[item.tipe].label, item.aktif ? 'Ya' : 'Tidak', item.variabel.join(', '), formatDate(item.updatedAt)]),
      }],
      notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Template WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Kelola template pesan untuk notifikasi otomatis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPdf}>
            <Download className="size-4" />
            Export PDF
          </Button>
          <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
            <Plus className="size-4" />
            Buat Template
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-card shadow-sm"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Template</p><p className="mt-2 text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="border-0 bg-card shadow-sm"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Template Aktif</p><p className="mt-2 text-2xl font-bold text-emerald-600">{stats.active}</p></CardContent></Card>
        <Card className="border-0 bg-card shadow-sm"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Broadcast</p><p className="mt-2 text-2xl font-bold text-violet-600">{stats.broadcast}</p></CardContent></Card>
        <Card className="border-0 bg-card shadow-sm"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Template Nonaktif</p><p className="mt-2 text-2xl font-bold text-amber-600">{stats.inactive}</p></CardContent></Card>
      </div>

      {/* Gateway Status */}
      <Card className="border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex size-12 items-center justify-center rounded-xl',
                gatewayConnected ? 'bg-emerald-500/10' : 'bg-red-500/10'
              )}>
                {gatewayConnected ? (
                  <Wifi className="size-6 text-emerald-600" />
                ) : (
                  <WifiOff className="size-6 text-red-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Status Gateway WhatsApp</h3>
                  <Badge className={cn(
                    gatewayConnected 
                      ? 'bg-emerald-500/10 text-emerald-600' 
                      : 'bg-red-500/10 text-red-600'
                  )}>
                    {gatewayConnected ? 'Terhubung' : 'Terputus'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {gatewayConnected 
                    ? 'Gateway aktif dan siap mengirim pesan' 
                    : 'Silakan periksa koneksi WhatsApp Gateway'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Perangkat</p>
                <p className="font-medium">+62 812-3456-7890</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setGatewayConnected((prev) => !prev); toast({ variant: 'default', title: gatewayConnected ? 'Gateway diputus' : 'Gateway dihubungkan', description: 'Status gateway disimulasikan secara lokal.' }) }}>
                Pengaturan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variable Helper */}
      <Card className="border-0 bg-muted/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-2">Variabel yang Tersedia</p>
              <div className="flex flex-wrap gap-2">
                {['{nama}', '{nominal}', '{kode}', '{tanggal}', '{validator}', '{status}', '{hari}', '{bulan}', '{total}', '{munfiq}', '{kecamatan}'].map((v) => (
                  <Badge key={v} variant="secondary" className="font-mono text-xs cursor-pointer hover:bg-muted" onClick={() => navigator.clipboard.writeText(v)}>
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, konten, tipe..." className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', ...Object.keys(templateTypeConfig)] as Array<'all' | keyof typeof templateTypeConfig>).map((item) => (
                <Button key={item} size="sm" variant={typeFilter === item ? 'default' : 'outline'} className={cn(typeFilter === item && 'bg-emerald-600 hover:bg-emerald-700')} onClick={() => setTypeFilter(item)}>
                  {item === 'all' ? 'Semua' : templateTypeConfig[item].label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTemplates.map((template) => {
          const config = templateTypeConfig[template.tipe]
          return (
            <Card key={template.id} className="border-0 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex size-10 items-center justify-center rounded-lg', config.color)}>
                      <config.icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.nama}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{config.label}</Badge>
                        <span className="text-xs">Diperbarui {formatDate(template.updatedAt)}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.aktif}
                      onCheckedChange={() => handleToggleTemplate(template.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Content Preview */}
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                    {template.konten}
                  </p>
                </div>

                {/* Variables */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Variabel:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variabel.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs font-mono">
                        {`{${v}}`}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1.5"
                    onClick={() => handlePreview(template)}
                  >
                    <Eye className="size-4" />
                    Preview
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openEdit(template)}>
                    <Edit className="size-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleDuplicate(template)}>
                    <Copy className="size-4" />
                    Duplikat
                  </Button>
                  <div className="flex-1" />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5"
                    onClick={() => handleTestSend(template)}
                    disabled={!gatewayConnected}
                  >
                    <Send className="size-4" />
                    Test Kirim
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preview Pesan</DialogTitle>
            <DialogDescription>
              Tampilan pesan di WhatsApp dengan data contoh
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="w-full max-w-[320px]">
                  <MessagePreview content={selectedTemplate.konten} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Tutup
                </Button>
                <Button 
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleTestSend(selectedTemplate)}
                  disabled={!gatewayConnected}
                >
                  <Send className="size-4" />
                  Test Kirim
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Template' : 'Buat Template Baru'}</DialogTitle>
            <DialogDescription>Kelola template pesan operasional, reminder, validasi, dan broadcast.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Template</Label>
              <Input value={formData.nama} onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))} className="mt-2" placeholder="Misal: Reminder Setoran Mingguan" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Tipe</Label>
                <select className="mt-2 h-10 w-full rounded-md border border-border/50 bg-background px-3 text-sm" value={formData.tipe} onChange={(e) => setFormData((prev) => ({ ...prev, tipe: e.target.value as keyof typeof templateTypeConfig }))}>
                  {Object.entries(templateTypeConfig).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Variabel</Label>
                <Input value={formData.variabel} onChange={(e) => setFormData((prev) => ({ ...prev, variabel: e.target.value }))} className="mt-2" placeholder="nama,nominal,kode,tanggal" />
              </div>
            </div>
            <div>
              <Label>Konten Pesan</Label>
              <Textarea value={formData.konten} onChange={(e) => setFormData((prev) => ({ ...prev, konten: e.target.value }))} className="mt-2 min-h-40" placeholder="Tulis isi template pesan..." />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <p className="text-sm font-medium">Aktifkan template</p>
                <p className="text-xs text-muted-foreground">Template nonaktif tidak akan dipakai untuk pengiriman otomatis.</p>
              </div>
              <Switch checked={formData.aktif} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, aktif: checked }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>Batal</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveTemplate}>{editingId ? 'Update' : 'Simpan'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
