"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ACTIVITY_LOG_EVENT, readActivityLogs, type ActivityLogItem } from "@/lib/activity-log"
import { useAuth, roleDisplayNames } from "@/lib/auth-context"
import { useAssignedGorutKecamatan } from "@/MODUL GORUT TERBARU/lib/gorut/operational-scope"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { useManagedUsers } from "@/lib/managed-users"
import { cn } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Clock,
  CheckCircle2,
  Edit3,
  Camera,
  Key,
  Smartphone,
  Monitor,
  ChevronLeft,
  BadgeCheck,
  Fingerprint,
  Copy,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const roleBio: Record<string, string> = {
  super_admin_pc: "Super Administrator PIINDUNG - Pengelola sistem informasi LAZISNU Kabupaten Garut",
  admin_pc: "Administrator portal PIINDUNG - Pengelola konten dan informasi publik LAZISNU Garut",
  admin_upzis: "Administrator UPZIS - Pengelola data dan koordinasi layanan tingkat UPZIS",
  admin_kordes: "Administrator Kordes/Ranting - Penghubung data dan informasi lapangan PIINDUNG",
}

function memberIdFromUserId(userId: string) {
  return `PIINDUNG-${userId.toUpperCase().replace(/[^A-Z0-9-]/g, "-")}`
}

export default function ProfilPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { scopedRoleLabel } = useAssignedGorutKecamatan()
  const managedUsers = useManagedUsers()
  const [copiedId, setCopiedId] = useState(false)
  const [logs, setLogs] = useState<ActivityLogItem[]>([])

  useEffect(() => {
    setLogs(readActivityLogs())

    function handleLogUpdated(event: Event) {
      const customEvent = event as CustomEvent<ActivityLogItem[]>
      setLogs(customEvent.detail ?? readActivityLogs())
    }

    function handleStorageUpdated(event: StorageEvent) {
      if (event.key === "piindung-activity-log") setLogs(readActivityLogs())
    }

    window.addEventListener(ACTIVITY_LOG_EVENT, handleLogUpdated)
    window.addEventListener("storage", handleStorageUpdated)

    return () => {
      window.removeEventListener(ACTIVITY_LOG_EVENT, handleLogUpdated)
      window.removeEventListener("storage", handleStorageUpdated)
    }
  }, [])

  const managedUser = useMemo(
    () => managedUsers.find((item) => item.id === user?.id || item.email === user?.email),
    [managedUsers, user?.email, user?.id]
  )

  const loginLogs = useMemo(
    () => logs.filter((log) => log.type === "Login" && log.userName === (user?.name ?? "") && log.status === "Success"),
    [logs, user?.name]
  )

  const latestLogin = loginLogs.find((log) => log.loginAction === "Login")

  const securityActivities = useMemo(
    () => loginLogs.slice(0, 3).map((activity, index) => ({
      id: activity.id,
      device: activity.device ?? "Perangkat tidak terdeteksi",
      location: "Lokasi tidak tersedia",
      time: index === 0 ? "Sekarang (Aktif)" : activity.dateTime,
      isCurrent: index === 0,
    })),
    [loginLogs]
  )

  const userProfileData = useMemo(() => {
    const currentName = managedUser?.name ?? user?.name ?? "Pengguna PIINDUNG"
    const currentEmail = managedUser?.email ?? user?.email ?? "-"
    const currentPhone = managedUser?.phone ? `+62 ${managedUser.phone.replace(/^0/, "").replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}` : "Belum diatur"
    const currentRole = managedUser?.role ?? user?.role ?? "admin_pc"

    return {
      id: user?.id ?? managedUser?.id ?? "-",
      memberId: memberIdFromUserId(user?.id ?? managedUser?.id ?? "member"),
      name: currentName,
      email: currentEmail,
      phone: currentPhone,
      address: "Data alamat belum diisi",
      username: currentEmail.includes("@") ? currentEmail.split("@")[0] : currentName.toLowerCase().replace(/\s+/g, "."),
      bio: roleBio[currentRole] ?? "Administrator PIINDUNG",
      avatar: managedUser?.avatar ?? user?.avatar ?? null,
      role: currentRole,
      status: managedUser?.status === "Aktif" ? "active" : "inactive",
      isVerified: Boolean(user),
      joinDate: "Data bergabung belum tersedia",
      lastLogin: managedUser?.lastLogin ?? latestLogin?.dateTime ?? "Belum pernah login",
      lastPasswordChange: managedUser?.passwordUpdatedAt ?? "Belum pernah diubah",
      totalLogins: loginLogs.filter((log) => log.loginAction === "Login").length,
      currentDevice: latestLogin?.device ?? "Perangkat belum terdeteksi",
      activeSessions: securityActivities.length || 1,
    }
  }, [latestLogin?.dateTime, latestLogin?.device, loginLogs, managedUser?.avatar, managedUser?.email, managedUser?.id, managedUser?.lastLogin, managedUser?.passwordUpdatedAt, managedUser?.phone, managedUser?.role, managedUser?.status, managedUser?.name, securityActivities.length, user])

  const handleCopyId = () => {
    navigator.clipboard.writeText(userProfileData.memberId)
    setCopiedId(true)
    toast.success("ID Member berhasil disalin")
    setTimeout(() => setCopiedId(false), 2000)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const verificationUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${userProfileData.memberId}`

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-5xl flex-1 px-4 py-6 lg:py-8">
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
          <h1 className="text-2xl lg:text-3xl font-bold">Profil Saya</h1>
          <p className="text-muted-foreground mt-1">Kelola informasi profil dan keamanan akun Anda</p>
        </div>

        <div className="space-y-6">
          {/* SECTION 1: Profile Header Card */}
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="relative">
              {/* Premium gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e]" />
              
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id="profile-grid" width="8" height="8" patternUnits="userSpaceOnUse">
                      <circle cx="4" cy="4" r="1" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#profile-grid)" />
                </svg>
              </div>
              
              {/* Gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
              
              <div className="relative z-10 p-6 lg:p-8 pb-20">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Large Avatar */}
                  <div className="relative group">
                    <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl">
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage src={userProfileData.avatar || undefined} alt={userProfileData.name} />
                        <AvatarFallback className="rounded-none text-3xl lg:text-4xl bg-gradient-to-br from-primary to-secondary text-white">
                          {getInitials(userProfileData.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Verified badge */}
                    {userProfileData.isVerified && (
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                        <BadgeCheck className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Profile Info */}
                  <div className="flex-1 text-white">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-2xl lg:text-3xl font-bold">{userProfileData.name}</h2>
                      {userProfileData.isVerified && (
                        <Badge className="bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Terverifikasi
                        </Badge>
                      )}
                    </div>
                    
                    <Badge className="bg-white/10 text-white border border-white/20 hover:bg-white/20 mb-3">
                      <Shield className="h-3 w-3 mr-1" />
                      {scopedRoleLabel ?? (user?.role ? roleDisplayNames[user.role] : "Administrator")}
                    </Badge>
                    
                    <p className="text-white/80 text-sm lg:text-base max-w-xl mb-4">
                      {userProfileData.bio}
                    </p>
                    
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Bergabung sejak {userProfileData.joinDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status bar */}
            <div className="bg-card px-6 py-4 border-t flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">Aktif</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Login terakhir: {userProfileData.lastLogin}</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/pengaturan-profil">
                  <Edit3 className="h-4 w-4" />
                  Edit Profil
                </Link>
              </Button>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* SECTION 2: Complete Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informasi Lengkap
                </CardTitle>
                <CardDescription>Data profil dan akun Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <InfoRow icon={User} label="Nama Lengkap" value={userProfileData.name} />
                  <InfoRow icon={Mail} label="Email" value={userProfileData.email} />
                  <InfoRow icon={Phone} label="Nomor HP" value={userProfileData.phone} />
                  <InfoRow icon={MapPin} label="Alamat" value={userProfileData.address} />
                  <Separator />
                  <InfoRow icon={User} label="Username" value={userProfileData.username} />
                  <InfoRow icon={Shield} label="Role / Hak Akses" value={user?.role ? roleDisplayNames[user.role] : "Administrator"} />
                  <InfoRow icon={Clock} label="Login Terakhir" value={userProfileData.lastLogin} />
                  <div className="flex items-start gap-3 py-2">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Status Akun</p>
                      <p className="font-medium text-green-600 dark:text-green-400">Aktif</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 3: QR / Barcode Verification */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  Verifikasi Identitas
                </CardTitle>
                <CardDescription>QR Code identitas digital terverifikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  {/* QR Code Container */}
                  <div className="relative p-4 bg-white rounded-2xl shadow-inner mb-4">
                    {/* Decorative corners */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary rounded-br-lg" />
                    
                    <QRCodeSVG
                      value={verificationUrl}
                      size={160}
                      level="H"
                      includeMargin={false}
                      className="rounded-lg"
                    />
                  </div>
                  
                  {/* Member ID */}
                  <div className="flex items-center gap-2 mb-3">
                    <code className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono">
                      {userProfileData.memberId}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopyId}
                    >
                      <Copy className={cn("h-4 w-4", copiedId && "text-green-500")} />
                    </Button>
                  </div>
                  
                  {/* Verification Status */}
                  <div className="w-full p-4 bg-gradient-to-r from-green-500/10 via-green-500/5 to-green-500/10 rounded-xl border border-green-500/20 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <BadgeCheck className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        Verified {user?.role ? roleDisplayNames[user.role] : "Admin"} PIINDUNG
                      </span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Scan QR Code untuk memverifikasi identitas administrator ini
                    </p>
                  </div>
                  
                  <Button variant="outline" size="sm" className="gap-2" asChild>
                    <Link href={`/verify/${userProfileData.memberId}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                      Lihat Halaman Verifikasi
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 4: Account Actions */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Pengaturan Akun</CardTitle>
              <CardDescription>Kelola data dan keamanan akun Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <ActionButton icon={Edit3} label="Edit Profil" />
                <ActionButton icon={Smartphone} label="Ganti Nomor HP" />
                <ActionButton icon={Key} label="Ganti Password" />
                <ActionButton icon={Camera} label="Upload Foto" />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 5: Security Information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Keamanan Akun
              </CardTitle>
              <CardDescription>Informasi keamanan dan aktivitas login</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SecurityStat
                  icon={Key}
                  label="Password Terakhir Diubah"
                  value={userProfileData.lastPasswordChange}
                />
                <SecurityStat
                  icon={Monitor}
                  label="Total Login"
                  value={`${userProfileData.totalLogins} kali`}
                />
                <SecurityStat
                  icon={Smartphone}
                  label="Sesi Aktif"
                  value={`${userProfileData.activeSessions} perangkat`}
                />
                <SecurityStat
                  icon={Clock}
                  label="Login Terakhir"
                  value={userProfileData.lastLogin}
                />
              </div>
              
              <Separator />
              
              {/* Device Sessions */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Perangkat & Sesi Aktif
                </h4>
                <div className="space-y-3">
                  {securityActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl transition-colors",
                        activity.isCurrent
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          activity.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Monitor className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.device}</p>
                          <p className="text-xs text-muted-foreground">{activity.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm",
                          activity.isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                        )}>
                          {activity.time}
                        </p>
                        {activity.isCurrent && (
                          <Badge variant="outline" className="text-xs mt-1 border-primary/30 text-primary">
                            Perangkat Ini
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <SimpleFooter />
    </div>
  )
}

// Info Row Component
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm truncate">{value}</p>
      </div>
    </div>
  )
}

// Action Button Component
function ActionButton({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <Button
      variant="outline"
      className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </Button>
  )
}

// Security Stat Component
function SecurityStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-3 bg-muted/50 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  )
}
