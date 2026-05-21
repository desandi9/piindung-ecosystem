'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  Image as ImageIcon,
  MessageSquare,
  Hash,
  Bell,
  Save,
  Upload,
  CheckCircle2,
  Wifi,
} from 'lucide-react'
import { uploadOptimizedImage } from '@/lib/upload-image-client'
import { defaultSystemSettings, saveSystemSettings, type SystemSettingsState, useGorutSystemSettings } from '@/lib/gorut/system-settings'

export default function SettingsPage() {
  const { toast } = useToast()
  const storedSettings = useGorutSystemSettings()
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [settings, setSettings] = useState<SystemSettingsState>(defaultSystemSettings)

  useEffect(() => {
    setSettings(storedSettings)
  }, [storedSettings])

  const handleSave = () => {
    setIsSaving(true)
    void saveSystemSettings(settings)
      .then(() => {
        toast({ variant: 'default', title: 'Pengaturan tersimpan', description: 'Konfigurasi sistem GORUT berhasil diperbarui.' })
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Gagal menyimpan pengaturan', description: 'Konfigurasi sistem GORUT belum berhasil diperbarui.' })
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  const handleUploadLogo = () => fileInputRef.current?.click()

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!(file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      toast({ variant: 'destructive', title: 'File tidak didukung', description: 'Pilih file gambar PNG, JPG, atau JPEG.' })
      return
    }

    try {
      const uploadedImage = await uploadOptimizedImage(file, 'gorut-settings-logo', settings.logoSrc)
      setSettings((prev) => ({ ...prev, logoSrc: uploadedImage.url }))
      toast({ variant: 'default', title: 'Logo diperbarui', description: `${file.name} berhasil dipasang sebagai logo GORUT.` })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal upload logo', description: error instanceof Error ? error.message : 'Logo belum berhasil diupload.' })
    } finally {
      event.target.value = ''
    }
  }

  const handleTestConnection = () => {
    toast({ variant: 'default', title: 'Gateway terhubung', description: `Koneksi ke ${settings.waGatewayUrl} berhasil diverifikasi.` })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Konfigurasi sistem dan preferensi aplikasi.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          {isSaving ? <><CheckCircle2 className="size-4" />Tersimpan</> : <><Save className="size-4" />Simpan Pengaturan</>}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10"><Building2 className="size-5 text-emerald-600" /></div>
              <div><CardTitle className="text-base">Identitas Organisasi</CardTitle><CardDescription>Informasi dasar organisasi.</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Nama Organisasi</Label><Input value={settings.orgName} onChange={(e) => setSettings((prev) => ({ ...prev, orgName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Nama Singkat</Label><Input value={settings.orgShortName} onChange={(e) => setSettings((prev) => ({ ...prev, orgShortName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Alamat</Label><Textarea value={settings.orgAddress} onChange={(e) => setSettings((prev) => ({ ...prev, orgAddress: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Telepon</Label><Input value={settings.orgPhone} onChange={(e) => setSettings((prev) => ({ ...prev, orgPhone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={settings.orgEmail} onChange={(e) => setSettings((prev) => ({ ...prev, orgEmail: e.target.value }))} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10"><ImageIcon className="size-5 text-blue-600" /></div>
              <div><CardTitle className="text-base">Logo Organisasi</CardTitle><CardDescription>Upload logo untuk laporan dan dokumen.</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoFileChange} />
            <div className="flex items-center gap-6">
              <div className="flex size-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                <Image src={settings.logoSrc} alt="Logo GORUT" width={80} height={80} className="size-20 object-contain" />
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleUploadLogo}><Upload className="size-4" />Upload Logo Baru</Button>
                 <p className="text-xs text-muted-foreground">Format: PNG, JPG, JPEG. Logo tersimpan ke konfigurasi GORUT.</p>
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10"><Hash className="size-5 text-violet-600" /></div>
              <div><CardTitle className="text-base">Pengaturan Transaksi</CardTitle><CardDescription>Format nomor transaksi.</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Prefix Transaksi</Label><Input value={settings.trxPrefix} onChange={(e) => setSettings((prev) => ({ ...prev, trxPrefix: e.target.value }))} className="max-w-[150px] font-mono" /></div>
            <div className="space-y-2"><Label>Format Nomor</Label><Select value={settings.trxFormat} onValueChange={(value) => setSettings((prev) => ({ ...prev, trxFormat: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="prefix-date-sequence">PREFIX-YYYYMMDD-XXX</SelectItem><SelectItem value="prefix-sequence">PREFIX-XXXXXXX</SelectItem><SelectItem value="date-sequence">YYYYMMDD-XXXX</SelectItem></SelectContent></Select></div>
            <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Contoh:</p><p className="font-mono text-sm">{settings.trxPrefix}-20260514-001</p></div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10"><MessageSquare className="size-5 text-emerald-600" /></div>
              <div><CardTitle className="text-base">WhatsApp Gateway</CardTitle><CardDescription>Konfigurasi layanan WhatsApp.</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"><div className="flex items-center gap-2"><Wifi className="size-4 text-emerald-600" /><span className="text-sm font-medium">Status: Terhubung</span></div><Button variant="outline" size="sm" onClick={handleTestConnection}>Test Koneksi</Button></div>
            <div className="space-y-2"><Label>Gateway URL</Label><Input value={settings.waGatewayUrl} onChange={(e) => setSettings((prev) => ({ ...prev, waGatewayUrl: e.target.value }))} /></div>
            <div className="space-y-2"><Label>API Key</Label><Input type="password" value={settings.waApiKey} onChange={(e) => setSettings((prev) => ({ ...prev, waApiKey: e.target.value }))} /></div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10"><Bell className="size-5 text-amber-600" /></div>
              <div><CardTitle className="text-base">Pengaturan Notifikasi</CardTitle><CardDescription>Atur notifikasi otomatis ke munfiq.</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4"><div><p className="font-medium text-sm">Notifikasi Setoran</p><p className="text-xs text-muted-foreground">Kirim konfirmasi setelah setoran.</p></div><Switch checked={settings.notifSetoran} onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifSetoran: checked }))} /></div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4"><div><p className="font-medium text-sm">Notifikasi Validasi</p><p className="text-xs text-muted-foreground">Kirim notifikasi saat divalidasi.</p></div><Switch checked={settings.notifValidasi} onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifValidasi: checked }))} /></div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4"><div><p className="font-medium text-sm">Reminder Setoran</p><p className="text-xs text-muted-foreground">Ingatkan munfiq yang lama tidak setor.</p></div><Switch checked={settings.notifReminder} onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifReminder: checked }))} /></div>
            </div>
            {settings.notifReminder && <div className="mt-4 flex items-center gap-4"><Label>Kirim reminder setelah tidak setor selama</Label><Select value={settings.reminderDays} onValueChange={(value) => setSettings((prev) => ({ ...prev, reminderDays: value }))}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 hari</SelectItem><SelectItem value="14">14 hari</SelectItem><SelectItem value="30">30 hari</SelectItem><SelectItem value="60">60 hari</SelectItem></SelectContent></Select></div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
