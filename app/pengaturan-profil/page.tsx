"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { refreshManagedUsers, resetManagedUserPassword, updateManagedUser, useManagedUsers } from "@/lib/managed-users"
import {
  User,
  Mail,
  Phone,
  Camera,
  Key,
  ChevronLeft,
  Eye,
  EyeOff,
  Save,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import { toast } from "sonner"

export default function PengaturanProfilPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const managedUsers = useManagedUsers()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const managedUser = managedUsers.find((item) => item.id === user?.id || item.email === user?.email)
  
  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null)
  const [pendingAvatarSize, setPendingAvatarSize] = useState<{ width: number; height: number } | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropX, setCropX] = useState(0)
  const [cropY, setCropY] = useState(0)
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; cropX: number; cropY: number } | null>(null)
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Loading states
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setName(managedUser?.name ?? user?.name ?? "")
    setEmail(managedUser?.email ?? user?.email ?? "")
    setPhone(managedUser?.phone ?? "")
    setAvatar(managedUser?.avatar ?? user?.avatar ?? null)
  }, [managedUser?.avatar, managedUser?.email, managedUser?.name, managedUser?.phone, user?.avatar, user?.email, user?.name])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 10MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = async () => {
        const result = reader.result as string
        const image = new window.Image()
        image.src = result
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve()
          image.onerror = () => reject(new Error("Gagal memuat gambar"))
        })

        setPendingAvatar(result)
        setPendingAvatarSize({ width: image.width, height: image.height })
        setCropZoom(1)
        setCropX(0)
        setCropY(0)
        setCropOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const applyAvatarCrop = async () => {
    if (!pendingAvatar) return

    const image = new window.Image()
    image.src = pendingAvatar
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("Gagal memuat gambar"))
    })

    const outputSize = 512
    const previewSize = 288
    const offsetScale = outputSize / previewSize
    const canvas = document.createElement("canvas")
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext("2d")
    if (!context) return

    const baseScale = Math.max(outputSize / image.width, outputSize / image.height)
    const scale = baseScale * cropZoom
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale
    const offsetX = (outputSize - drawWidth) / 2 + cropX * offsetScale
    const offsetY = (outputSize - drawHeight) / 2 + cropY * offsetScale

    context.clearRect(0, 0, outputSize, outputSize)
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
    if (!blob) {
      toast.error("Gagal menyiapkan avatar hasil crop")
      return
    }

    try {
      const file = new File([blob], "avatar.png", { type: "image/png" })
      const uploadedImage = await uploadOptimizedImage(file, "avatar", avatar ?? managedUser?.avatar ?? user?.avatar ?? null)
      setAvatar(uploadedImage.url)
      setPendingAvatar(null)
      setPendingAvatarSize(null)
      setCropOpen(false)
      toast.success(buildImageOptimizationMessage(uploadedImage))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload avatar gagal.")
    }
  }

  const previewSize = 288
  const baseScale = pendingAvatarSize ? Math.max(previewSize / pendingAvatarSize.width, previewSize / pendingAvatarSize.height) : 1
  const previewWidth = pendingAvatarSize ? pendingAvatarSize.width * baseScale * cropZoom : previewSize
  const previewHeight = pendingAvatarSize ? pendingAvatarSize.height * baseScale * cropZoom : previewSize

  function handleCropPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      cropX,
      cropY,
    }
    setIsDraggingCrop(true)
  }

  function handleCropPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingCrop || !dragStartRef.current) return

    const deltaX = event.clientX - dragStartRef.current.x
    const deltaY = event.clientY - dragStartRef.current.y
    setCropX(dragStartRef.current.cropX + deltaX)
    setCropY(dragStartRef.current.cropY + deltaY)
  }

  function handleCropPointerUp() {
    setIsDraggingCrop(false)
    dragStartRef.current = null
  }

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error("Anda belum login")
      return
    }

    setSavingProfile(true)
    try {
      const updatedUser = await updateManagedUser(user.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar ?? managedUser?.avatar ?? "",
      })

      await refreshManagedUsers()

      const sessionResponse = await fetch("/api/auth/me", { credentials: "include" })
      const sessionPayload = sessionResponse.ok
        ? await sessionResponse.json() as { user: { id: string; name: string; email: string; role: typeof updatedUser.role; avatar?: string } | null }
        : null

      setUser(sessionPayload?.user ?? {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar || undefined,
      })
      toast.success("Profil berhasil disimpan")
    } catch (error) {
      console.error(error)
      toast.error("Gagal menyimpan profil")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePassword = async () => {
    if (!user || !managedUser) {
      toast.error("Data akun tidak ditemukan")
      return
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Semua field password harus diisi")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Password baru tidak cocok")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter")
      return
    }
    if (managedUser.password !== currentPassword) {
      toast.error("Password saat ini tidak sesuai")
      return
    }
    
    setSavingPassword(true)
    try {
      await resetManagedUserPassword(user.id, newPassword)
      await refreshManagedUsers()
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password berhasil diubah")
    } catch (error) {
      console.error(error)
      toast.error("Gagal mengubah password")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-3xl flex-1 px-4 py-6 lg:py-8">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Pengaturan Profil</h1>
          <p className="text-muted-foreground mt-1">Ubah informasi profil dan keamanan akun Anda</p>
        </div>

        <div className="space-y-6">
          {/* Profile Photo Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Foto Profil
              </CardTitle>
              <CardDescription>Ubah foto profil Anda (maks. 2MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-border shadow-lg">
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={avatar || undefined} alt={name} />
                      <AvatarFallback className="rounded-none text-xl bg-gradient-to-br from-primary to-secondary text-white">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <Button variant="outline" size="sm" onClick={handleAvatarClick}>
                    <Camera className="h-4 w-4 mr-2" />
                    Pilih Foto
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Format: JPG, PNG. Maksimal 2MB.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informasi Pribadi
              </CardTitle>
              <CardDescription>Ubah nama, email, dan nomor HP Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="h-11"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  className="h-11"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Nomor HP
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor HP"
                  className="h-11"
                />
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={savingProfile}
                  className="w-full sm:w-auto"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Ubah Password
              </CardTitle>
              <CardDescription>Pastikan password baru minimal 8 karakter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleSavePassword} 
                  disabled={savingPassword}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengubah...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Ubah Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={cropOpen} onOpenChange={setCropOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Atur Crop Foto Profil</DialogTitle>
              <DialogDescription>Geser foto langsung pada preview lalu atur zoom secukupnya agar hasil foto profil rapi.</DialogDescription>
            </DialogHeader>

            {pendingAvatar ? (
              <div className="space-y-4">
                <div
                  className="mx-auto h-72 w-72 overflow-hidden rounded-3xl border border-border bg-muted relative touch-none cursor-grab active:cursor-grabbing"
                  onPointerDown={handleCropPointerDown}
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerUp}
                  onPointerLeave={handleCropPointerUp}
                >
                  <img
                    src={pendingAvatar}
                    alt="Preview crop avatar"
                    className="absolute left-1/2 top-1/2 max-w-none select-none"
                    draggable={false}
                    style={{
                      width: `${previewWidth}px`,
                      height: `${previewHeight}px`,
                      transform: `translate(calc(-50% + ${cropX}px), calc(-50% + ${cropY}px))`,
                      transformOrigin: "center",
                    }}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Zoom</Label>
                    <input type="range" min="1" max="1.8" step="0.02" value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} className="w-full" />
                  </div>
                  <p className="text-xs text-muted-foreground">Tips: klik dan geser foto langsung pada kotak preview untuk mengatur posisi wajah atau objek utama.</p>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCropOpen(false); setPendingAvatar(null); setPendingAvatarSize(null) }}>Batal</Button>
              <Button type="button" onClick={applyAvatarCrop}>Gunakan Foto Ini</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      
      <SimpleFooter />
    </div>
  )
}
