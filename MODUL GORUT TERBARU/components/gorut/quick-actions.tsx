'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, CheckCircle2, FileText, Upload, Users, Megaphone, Target, BarChart3, ArrowRight, X, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  gradient: string
  hoverGlow: string
  modal: 'dialog' | 'sheet'
  category: 'data' | 'approval' | 'report' | 'admin'
}

const actions: QuickAction[] = [
  {
    id: 'add-munfiq',
    title: 'Tambah Munfiq',
    description: 'Daftarkan munfiq baru ke sistem',
    icon: Plus,
    gradient: 'from-emerald-500 to-emerald-600',
    hoverGlow: 'group-hover:shadow-emerald-500/25',
    modal: 'dialog',
    category: 'data',
  },
  {
    id: 'input-setoran',
    title: 'Input Setoran',
    description: 'Catat setoran koin baru',
    icon: Plus,
    gradient: 'from-blue-500 to-blue-600',
    hoverGlow: 'group-hover:shadow-blue-500/25',
    modal: 'dialog',
    category: 'data',
  },
  {
    id: 'approve-setoran',
    title: 'Approve Setoran',
    description: 'Validasi setoran menunggu',
    icon: CheckCircle2,
    gradient: 'from-violet-500 to-violet-600',
    hoverGlow: 'group-hover:shadow-violet-500/25',
    modal: 'sheet',
    category: 'approval',
  },
  {
    id: 'broadcast-announcement',
    title: 'Broadcast Pengumuman',
    description: 'Kirim pengumuman ke seluruh sistem',
    icon: Megaphone,
    gradient: 'from-amber-500 to-amber-600',
    hoverGlow: 'group-hover:shadow-amber-500/25',
    modal: 'dialog',
    category: 'report',
  },
  {
    id: 'export-report',
    title: 'Export Laporan',
    description: 'Generate dan download laporan',
    icon: FileText,
    gradient: 'from-pink-500 to-pink-600',
    hoverGlow: 'group-hover:shadow-pink-500/25',
    modal: 'dialog',
    category: 'report',
  },
  {
    id: 'upload-archive',
    title: 'Upload Arsip',
    description: 'Upload dokumen ke digital archive',
    icon: Upload,
    gradient: 'from-cyan-500 to-cyan-600',
    hoverGlow: 'group-hover:shadow-cyan-500/25',
    modal: 'sheet',
    category: 'data',
  },
  {
    id: 'add-target',
    title: 'Tambah Target',
    description: 'Set target setoran untuk periode',
    icon: Target,
    gradient: 'from-red-500 to-red-600',
    hoverGlow: 'group-hover:shadow-red-500/25',
    modal: 'dialog',
    category: 'admin',
  },
  {
    id: 'add-user',
    title: 'Tambah Admin/User',
    description: 'Buat user akun baru untuk sistem',
    icon: Users,
    gradient: 'from-indigo-500 to-indigo-600',
    hoverGlow: 'group-hover:shadow-indigo-500/25',
    modal: 'sheet',
    category: 'admin',
  },
]

function ActionCard({ action, onOpenChange }: { action: QuickAction; onOpenChange: (id: string) => void }) {
  return (
    <button
      onClick={() => onOpenChange(action.id)}
      className={cn(
        'group h-full w-full text-left transition-all duration-300'
      )}
    >
      <div
        className={cn(
          'relative flex h-full min-h-[156px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/90 p-4 transition-all duration-300',
          'hover:border-white/10 hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)] hover:-translate-y-1 cursor-pointer backdrop-blur-sm',
          action.hoverGlow
        )}
      >
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-[0.08]',
          action.gradient
        )} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex items-start justify-between">
          <div
            className={cn(
              'flex size-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl',
              action.gradient
            )}
          >
            <action.icon className="size-5" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full border border-border/50 bg-background/60 px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground shadow-sm">
              {action.category}
            </Badge>
            <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
          </div>
        </div>
        <div className="relative mt-4 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{action.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
          <span>Eksekusi cepat</span>
          <span className="font-medium text-foreground/80">Buka</span>
        </div>
      </div>
    </button>
  )
}

function QuickActionModals({ activeAction, onClose }: { activeAction: string | null; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 600))
    setSuccessMessage(`${actions.find(a => a.id === activeAction)?.title} berhasil dilakukan!`)
    setIsLoading(false)
    closeTimerRef.current = window.setTimeout(() => {
      onClose()
      setFormData({})
      setSuccessMessage('')
    }, 1500)
  }

  // Dialog modals
  if (activeAction === 'add-munfiq') {
    return (
      <Dialog open={!!activeAction} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Munfiq Baru</DialogTitle>
            <DialogDescription>Daftarkan munfiq baru ke dalam sistem GORUT</DialogDescription>
          </DialogHeader>
          {successMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="size-6 text-emerald-500" />
              </div>
              <p className="text-center text-sm font-medium text-foreground">{successMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input placeholder="Nama Munfiq" value={formData.nama || ''} onChange={(e) => handleInputChange('nama', e.target.value)} />
              <Input placeholder="NIK" value={formData.nik || ''} onChange={(e) => handleInputChange('nik', e.target.value)} />
              <Input placeholder="No. Telepon" value={formData.noHp || ''} onChange={(e) => handleInputChange('noHp', e.target.value)} />
              <Input placeholder="Alamat" value={formData.alamat || ''} onChange={(e) => handleInputChange('alamat', e.target.value)} />
              <div className="flex gap-2 pt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1">Batal</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2">
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  Tambah
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  if (activeAction === 'input-setoran') {
    return (
      <Dialog open={!!activeAction} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Input Setoran Baru</DialogTitle>
            <DialogDescription>Catat setoran koin infaq yang masuk</DialogDescription>
          </DialogHeader>
          {successMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10">
                <Check className="size-6 text-blue-500" />
              </div>
              <p className="text-center text-sm font-medium text-foreground">{successMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input placeholder="Nama Munfiq" value={formData.munfiq || ''} onChange={(e) => handleInputChange('munfiq', e.target.value)} />
              <Input placeholder="Jumlah Setoran (Rp)" type="number" value={formData.jumlah || ''} onChange={(e) => handleInputChange('jumlah', e.target.value)} />
              <Input placeholder="Keterangan" value={formData.keterangan || ''} onChange={(e) => handleInputChange('keterangan', e.target.value)} />
              <div className="flex gap-2 pt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1">Batal</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2">
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  if (activeAction === 'broadcast-announcement') {
    return (
      <Dialog open={!!activeAction} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Broadcast Pengumuman</DialogTitle>
            <DialogDescription>Kirim pengumuman ke seluruh sistem</DialogDescription>
          </DialogHeader>
          {successMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10">
                <Check className="size-6 text-amber-500" />
              </div>
              <p className="text-center text-sm font-medium text-foreground">{successMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input placeholder="Judul Pengumuman" value={formData.judul || ''} onChange={(e) => handleInputChange('judul', e.target.value)} />
              <textarea className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Isi pengumuman..." value={formData.isi || ''} onChange={(e) => handleInputChange('isi', e.target.value)} rows={4} />
              <div className="flex gap-2 pt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1">Batal</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-amber-600 hover:bg-amber-700 gap-2">
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  Kirim
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  if (activeAction === 'export-report') {
    return (
      <Dialog open={!!activeAction} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Laporan</DialogTitle>
            <DialogDescription>Pilih periode dan format laporan</DialogDescription>
          </DialogHeader>
          {successMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-pink-500/10">
                <Check className="size-6 text-pink-500" />
              </div>
              <p className="text-center text-sm font-medium text-foreground">{successMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input type="month" value={formData.periode || ''} onChange={(e) => handleInputChange('periode', e.target.value)} />
              <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={formData.format || 'xlsx'} onChange={(e) => handleInputChange('format', e.target.value)}>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="csv">CSV (.csv)</option>
              </select>
              <div className="flex gap-2 pt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1">Batal</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-pink-600 hover:bg-pink-700 gap-2">
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  if (activeAction === 'add-target') {
    return (
      <Dialog open={!!activeAction} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Target Setoran</DialogTitle>
            <DialogDescription>Set target setoran untuk periode tertentu</DialogDescription>
          </DialogHeader>
          {successMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10">
                <Check className="size-6 text-red-500" />
              </div>
              <p className="text-center text-sm font-medium text-foreground">{successMessage}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={formData.kecamatan || ''} onChange={(e) => handleInputChange('kecamatan', e.target.value)}>
                <option value="">Pilih Kecamatan</option>
                <option value="garut-kota">Garut Kota</option>
                <option value="tarogong-kaler">Tarogong Kaler</option>
                <option value="tarogong-kidul">Tarogong Kidul</option>
              </select>
              <Input type="month" value={formData.periode || ''} onChange={(e) => handleInputChange('periode', e.target.value)} />
              <Input placeholder="Target (Rp)" type="number" value={formData.target || ''} onChange={(e) => handleInputChange('target', e.target.value)} />
              <div className="flex gap-2 pt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1">Batal</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-red-600 hover:bg-red-700 gap-2">
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  // Sheet modals
  if (activeAction === 'approve-setoran') {
    return (
      <Sheet open={!!activeAction} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Approve Setoran</SheetTitle>
            <SheetDescription>Review dan validasi setoran yang menunggu</SheetDescription>
          </SheetHeader>
          {successMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="flex size-12 items-center justify-center rounded-full bg-violet-500/10">
                <Check className="size-6 text-violet-500" />
              </div>
              <p className="text-center text-sm font-medium text-foreground">{successMessage}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                {[
                  { id: 1, munfiq: 'Ahmad Handoko', jumlah: 500000, tanggal: '2026-05-15' },
                  { id: 2, munfiq: 'Siti Nurhaliza', jumlah: 750000, tanggal: '2026-05-14' },
                  { id: 3, munfiq: 'Budi Santoso', jumlah: 600000, tanggal: '2026-05-13' },
                ].map((item) => (
                  <Card key={item.id} className="p-3 border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.munfiq}</p>
                        <p className="text-xs text-muted-foreground">Rp {item.jumlah.toLocaleString('id-ID')} • {item.tanggal}</p>
                      </div>
                      <Button size="sm" onClick={handleSubmit} disabled={isLoading} className="bg-violet-600 hover:bg-violet-700">
                        {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Approve'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  if (activeAction === 'upload-archive') {
    return (
      <Sheet open={!!activeAction} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Upload Arsip</SheetTitle>
            <SheetDescription>Upload dokumen ke digital archive</SheetDescription>
          </SheetHeader>
          {successMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="flex size-12 items-center justify-center rounded-full bg-cyan-500/10">
                <Check className="size-6 text-cyan-500" />
              </div>
              <p className="text-center text-sm font-medium text-foreground">{successMessage}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <Input placeholder="Nama Dokumen" value={formData.namaDoc || ''} onChange={(e) => handleInputChange('namaDoc', e.target.value)} />
              <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={formData.kategori || ''} onChange={(e) => handleInputChange('kategori', e.target.value)}>
                <option value="">Pilih Kategori</option>
                <option value="financial">Financial Reports</option>
                <option value="monthly">Monthly Reports</option>
                <option value="berita-acara">Berita Acara</option>
                <option value="templates">Templates</option>
              </select>
              <div className="rounded-lg border-2 border-dashed border-border/50 bg-muted/30 p-6 text-center hover:border-border cursor-pointer transition-colors">
                <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Klik atau drag file di sini</p>
                <p className="text-xs text-muted-foreground">PDF, Excel, Word (Max 10MB)</p>
              </div>
              <div className="flex gap-2 pt-4">
                <SheetClose asChild>
                  <Button variant="outline" className="flex-1">Batal</Button>
                </SheetClose>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-cyan-600 hover:bg-cyan-700 gap-2">
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  Upload
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  if (activeAction === 'add-user') {
    return (
      <Sheet open={!!activeAction} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Tambah Admin/User</SheetTitle>
            <SheetDescription>Buat user akun baru untuk sistem</SheetDescription>
          </SheetHeader>
          {successMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="flex size-12 items-center justify-center rounded-full bg-indigo-500/10">
                <Check className="size-6 text-indigo-500" />
              </div>
              <p className="text-center text-sm font-medium text-foreground">{successMessage}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <Input placeholder="Nama Lengkap" value={formData.nama || ''} onChange={(e) => handleInputChange('nama', e.target.value)} />
              <Input placeholder="Email" type="email" value={formData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} />
              <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={formData.role || ''} onChange={(e) => handleInputChange('role', e.target.value)}>
                <option value="">Pilih Role</option>
                <option value="admin-pc">Admin PC</option>
                <option value="upzis">UPZIS</option>
                <option value="ranting">Ranting</option>
                <option value="plpk">PLPK</option>
              </select>
              <Input placeholder="Password" type="password" value={formData.password || ''} onChange={(e) => handleInputChange('password', e.target.value)} />
              <div className="flex gap-2 pt-4">
                <SheetClose asChild>
                  <Button variant="outline" className="flex-1">Batal</Button>
                </SheetClose>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2">
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  Buat Akun
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  return null
}

export function QuickActions() {
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action, index) => (
          <div
            key={action.id}
            className={cn(
              'transition-all duration-500',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
            style={{ transitionDelay: `${index * 75}ms` }}
          >
            <ActionCard action={action} onOpenChange={setActiveAction} />
          </div>
        ))}
      </div>
      <QuickActionModals activeAction={activeAction} onClose={() => setActiveAction(null)} />
    </>
  )
}
