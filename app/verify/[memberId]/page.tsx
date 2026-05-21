"use client"

import { use } from "react"
import Link from "next/link"
import { roleDisplayNames, type UserRole } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  BadgeCheck,
  Shield,
  User,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock verification data (in real app, this would come from API based on memberId)
const verificationData: Record<string, {
  name: string
  role: UserRole
  status: "active" | "inactive"
  isVerified: boolean
  memberId: string
  organization: string
  joinDate: string
  avatar?: string
}> = {
  "PIINDUNG-SA-001": {
    name: "Desandi Herdiansyah",
    role: "super_admin_pc",
    status: "active",
    isVerified: true,
    memberId: "PIINDUNG-SA-001",
    organization: "LAZISNU Kabupaten Garut",
    joinDate: "15 Januari 2024",
    avatar: undefined,
  },
}

export default function VerifyPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = use(params)
  const userData = verificationData[memberId]
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Not found state
  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">ID Tidak Ditemukan</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Member ID yang Anda cari tidak terdaftar dalam sistem PIINDUNG.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] flex items-center justify-center p-4">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
      
      <Card className="relative w-full max-w-md shadow-2xl border-0 overflow-hidden">
        {/* Top verification banner */}
        <div className={cn(
          "p-4 text-white text-center",
          userData.isVerified && userData.status === "active"
            ? "bg-gradient-to-r from-green-600 to-green-500"
            : "bg-gradient-to-r from-red-600 to-red-500"
        )}>
          <div className="flex items-center justify-center gap-2">
            {userData.isVerified && userData.status === "active" ? (
              <>
                <BadgeCheck className="h-5 w-5" />
                <span className="font-semibold">IDENTITAS TERVERIFIKASI</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span className="font-semibold">TIDAK TERVERIFIKASI</span>
              </>
            )}
          </div>
        </div>
        
        <CardContent className="p-6 lg:p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0f3460] to-[#16213e] flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-lg">PIINDUNG</span>
            </div>
          </div>
          
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-primary/20 shadow-xl">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                  {getInitials(userData.name)}
                </AvatarFallback>
              </Avatar>
              {userData.isVerified && userData.status === "active" && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          </div>
          
          {/* Name & Role */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold mb-2">{userData.name}</h1>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
              <Shield className="h-3 w-3 mr-1" />
              {roleDisplayNames[userData.role]}
            </Badge>
          </div>
          
          {/* Verification Card */}
          <div className={cn(
            "p-4 rounded-xl mb-6",
            userData.isVerified && userData.status === "active"
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-red-500/10 border border-red-500/20"
          )}>
            <div className="text-center">
              {userData.isVerified && userData.status === "active" ? (
                <>
                  <BadgeCheck className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-600 dark:text-green-400 mb-1">
                    Verified {roleDisplayNames[userData.role]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Administrator ini terdaftar dan terverifikasi dalam sistem PIINDUNG
                  </p>
                </>
              ) : (
                <>
                  <Shield className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="font-semibold text-red-600 dark:text-red-400 mb-1">
                    Tidak Terverifikasi
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Akun ini tidak aktif atau tidak terverifikasi
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Details */}
          <div className="space-y-3 mb-6">
            <DetailRow
              icon={User}
              label="Member ID"
              value={userData.memberId}
            />
            <DetailRow
              icon={Building2}
              label="Organisasi"
              value={userData.organization}
            />
            <DetailRow
              icon={Calendar}
              label="Bergabung Sejak"
              value={userData.joinDate}
            />
            <DetailRow
              icon={Shield}
              label="Status"
              value={userData.status === "active" ? "Aktif" : "Tidak Aktif"}
              valueClassName={userData.status === "active" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
            />
          </div>
          
          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-4">
              Verifikasi dilakukan pada {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })} WIB
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ke Dashboard PIINDUNG
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Detail Row Component
function DetailRow({ 
  icon: Icon, 
  label, 
  value, 
  valueClassName 
}: { 
  icon: React.ElementType
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium truncate", valueClassName)}>{value}</p>
      </div>
    </div>
  )
}
