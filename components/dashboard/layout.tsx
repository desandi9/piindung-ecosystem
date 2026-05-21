"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"
import { useAdminRouteAccess } from "@/hooks/use-admin-route-access"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "./sidebar"
import { DashboardHeader } from "./header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const routeAccess = useAdminRouteAccess(pathname, user?.role)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [isLoading, router, user])

  if (isLoading || !user) {
    return <div className="min-h-screen bg-background" />
  }

  if (!routeAccess.canAccessDashboard) {
    return <AdminAccessState title="Dashboard Admin hanya tersedia untuk Super Admin PC dan Admin PC." />
  }

  if (!routeAccess.canAccessRoute) {
    return <AdminAccessState title="Halaman ini hanya dapat diakses oleh Super Admin PC." />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[260px]">
          <DashboardSidebar collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Header */}
      <DashboardHeader
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileMenuOpen(true)}
      />

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300 ease-out",
          sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

function AdminAccessState({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl items-center justify-center">
        <Card className="w-full border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle>Akses Ditolak</CardTitle>
            <CardDescription>{title}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild className="rounded-xl">
              <Link href="/dashboard">Kembali ke Beranda</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
