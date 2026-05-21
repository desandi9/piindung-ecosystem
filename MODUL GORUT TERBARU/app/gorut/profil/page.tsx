'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, ShieldCheck, Upload, UserCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth, roleDisplayNames } from '@/lib/auth-context'
import { useAssignedGorutKecamatan } from '@/lib/gorut/operational-scope'
import { defaultAccountProfile, loadAccountProfile, saveAccountProfile, type AccountProfileState } from '@/lib/gorut/account-profile'

export default function ProfilPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { scopedRoleLabel } = useAssignedGorutKecamatan()
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
        toast({ variant: 'default', title: 'Foto profil diperbarui', description: `${file.name} berhasil dipasang sebagai preview profil.` })
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSave = () => {
    saveAccountProfile(profile)
    toast({ variant: 'default', title: 'Profil tersimpan', description: 'Perubahan profil berhasil diperbarui di state lokal.' })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSave()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground">Kelola identitas admin, foto profil, dan kontak utama akun aktif.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-0 bg-card shadow-sm">
          <CardHeader><CardTitle className="text-base">Identitas Akun</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
            <div className="flex flex-col items-center text-center">
              <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/30">
                <Image src={profile.avatarSrc} alt="Profil" width={128} height={128} className="size-full object-cover" />
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-4 gap-2" onClick={handleUploadAvatar}><Upload className="size-4" />Upload Foto</Button>
            </div>
              <div className="space-y-3 rounded-lg border border-border/50 p-4">
                <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Peran</span><Badge className="bg-emerald-500/10 text-emerald-600">{scopedRoleLabel ?? (user?.role ? roleDisplayNames[user.role] : profile.role)}</Badge></div>
                <div className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4 text-emerald-600" />Akun aktif dan terverifikasi</div>
              </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-sm">
          <CardHeader><CardTitle className="text-base">Informasi Dasar</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={profile.email} onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))} className="pl-9" /></div></div>
              <div className="space-y-2"><Label>No. HP</Label><div className="relative"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} className="pl-9" /></div></div>
            </div>
            <div className="rounded-lg border border-border/50 p-4 text-sm text-muted-foreground"><div className="flex items-center gap-2"><UserCircle2 className="size-4 text-emerald-600" />Gunakan halaman ini untuk memperbarui identitas akun yang tampil di area admin.</div></div>
            <div className="flex justify-end pt-2"><Button type="submit" className="min-w-36 bg-emerald-600 hover:bg-emerald-700">Simpan Profil</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
