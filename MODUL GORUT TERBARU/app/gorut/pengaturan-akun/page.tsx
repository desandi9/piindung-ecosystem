'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Upload } from 'lucide-react'
import { defaultAccountProfile, loadAccountProfile, saveAccountProfile, type AccountProfileState } from '@/lib/gorut/account-profile'

export default function PengaturanAkunPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [profile, setProfile] = useState<AccountProfileState>(defaultAccountProfile)

  useEffect(() => {
    setProfile(loadAccountProfile())
  }, [])

  const handleUploadAvatar = () => fileInputRef.current?.click()

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'File tidak didukung', description: 'Pilih file gambar untuk foto profil.' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfile((prev) => ({ ...prev, avatarSrc: reader.result as string }))
        toast({ variant: 'default', title: 'Foto akun diperbarui', description: `${file.name} berhasil dipasang sebagai preview akun.` })
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSave = () => {
    saveAccountProfile(profile)
    toast({ variant: 'default', title: 'Pengaturan akun tersimpan', description: 'Perubahan profil dan preferensi keamanan diperbarui di state lokal.' })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSave()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
        <p className="text-sm text-muted-foreground">Kelola profil singkat dan preferensi keamanan akun yang sedang aktif.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader><CardTitle className="text-base">Profil Dasar</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
            <div className="flex items-center gap-4 rounded-lg border border-border/50 p-4">
              <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/30">
                <Image src={profile.avatarSrc} alt="Avatar akun" width={80} height={80} className="size-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium">Foto Akun</p>
                <p className="text-xs text-muted-foreground mt-1">Gunakan foto yang sama dengan halaman profil admin.</p>
                <Button type="button" variant="outline" size="sm" className="mt-3 gap-2" onClick={handleUploadAvatar}><Upload className="size-4" />Upload Foto</Button>
              </div>
            </div>
            <div className="space-y-2"><Label>Nama</Label><Input value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={profile.email} onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))} type="email" /></div>
            <div className="space-y-2"><Label>Nomor HP</Label><Input value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} /></div>
            <div className="flex justify-end pt-2"><Button type="submit" className="min-w-36 bg-emerald-600 hover:bg-emerald-700">Simpan Perubahan</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardHeader><CardTitle className="text-base">Keamanan & Notifikasi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4"><div><p className="font-medium text-sm">Two-factor authentication</p><p className="text-xs text-muted-foreground">Tambahan verifikasi saat login.</p></div><Switch checked={profile.twoFactor} onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, twoFactor: checked }))} /></div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4"><div><p className="font-medium text-sm">Login alert</p><p className="text-xs text-muted-foreground">Dapatkan notifikasi saat ada login baru.</p></div><Switch checked={profile.loginAlert} onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, loginAlert: checked }))} /></div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
