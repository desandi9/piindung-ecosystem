'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AlertCircle, ArrowLeft, Crown, Loader2, ShieldAlert } from 'lucide-react'
import { GorutSidebar, GorutNavbar } from '@/components/gorut'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clearDashboardEntryMarker, hasRecentDashboardEntry } from '@/lib/gorut/dashboard-transition'
import { useAuth, roleDisplayNames } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

export default function GorutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDashboardEntry, setIsDashboardEntry] = useState(false)
  const pathname = usePathname()
  const isWelcomePage = pathname === '/gorut'
  const isDashboardPage = pathname === '/gorut/dashboard'
  const canAccessGorut = user?.role === 'super_admin_pc' || user?.role === 'admin_pc' || user?.role === 'admin_upzis' || user?.role === 'admin_kordes'

  useEffect(() => {
    if (!isDashboardPage) {
      setIsDashboardEntry(false)
      return
    }

    if (!hasRecentDashboardEntry()) {
      setIsDashboardEntry(false)
      return
    }

    setIsDashboardEntry(true)

    const timeoutId = window.setTimeout(() => {
      setIsDashboardEntry(false)
      clearDashboardEntryMarker()
    }, 1400)

    return () => window.clearTimeout(timeoutId)
  }, [isDashboardPage])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Memeriksa akses modul GORUT...
        </div>
      </div>
    )
  }

  if (!canAccessGorut) {
    return (
      <div className="min-h-screen bg-background px-4 py-10 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
          <Card className="w-full border-border shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {user ? <ShieldAlert className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">Akses GORUT Sementara Khusus Super Admin</CardTitle>
                <CardDescription className="mx-auto max-w-2xl text-sm leading-relaxed">
                  Modul GORUT saat ini masih difokuskan untuk penyelesaian tampilan dan kontrol <span className="font-medium text-foreground">super admin</span>, <span className="font-medium text-foreground">admin PC</span>, <span className="font-medium text-foreground">admin UPZIS</span>, dan <span className="font-medium text-foreground">admin Kordes</span> dengan scope menu bertahap.
                  {user ? ` Role ${roleDisplayNames[user.role]} belum dibuka ke area ini untuk sementara.` : ' Silakan login menggunakan akun super admin, admin PC, admin UPZIS, atau admin Kordes untuk melanjutkan.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <Crown className="h-4 w-4 text-primary" />
                  Status Sementara
                </div>
                <p>
                  Scope menu untuk tiap role masih dibuka bertahap sesuai kebutuhan kerja operasional masing-masing.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild className="rounded-xl">
                  <Link href="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Dashboard Utama
                  </Link>
                </Button>
                {!user ? (
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/login">Login Sebagai Super Admin</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-background">
        {!isWelcomePage && (
          <GorutSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
        )}

      <div
        className={cn(
          'relative flex min-h-screen flex-col transition-all duration-300',
          !isWelcomePage && (sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[280px]')
        )}
      >
        {!isWelcomePage && (
          <div
            className={cn(
              'relative z-10 transition-all duration-700 ease-out',
              isDashboardEntry ? 'translate-y-[-10px] opacity-0 blur-[6px]' : 'translate-y-0 opacity-100 blur-0'
            )}
          >
            <GorutNavbar />
          </div>
        )}
        <main
          className={cn(
            'relative z-10 min-w-0 flex-1',
            isWelcomePage ? 'p-0' : 'p-6',
            isDashboardPage && 'overflow-x-hidden'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
