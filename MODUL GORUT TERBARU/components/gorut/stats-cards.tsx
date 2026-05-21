'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth, roleDisplayNames } from '@/lib/auth-context'
import { loadAccountProfile } from '@/lib/gorut/account-profile'
import { useAssignedGorutKecamatan } from '@/lib/gorut/operational-scope'
import { Users, Coins, MapPin, Clock, ArrowUpRight, ArrowDownRight, TrendingUp, ArrowRight, ShieldCheck } from 'lucide-react'
import type { StatistikGorut } from '@/lib/gorut/types'
import { formatRupiah } from '@/lib/gorut/data'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: StatistikGorut
}

// Animated counter hook
function useAnimatedCounter(endValue: number, duration: number = 2000, prefix: string = '', suffix: string = '') {
  const [displayValue, setDisplayValue] = useState('0')
  const [isAnimating, setIsAnimating] = useState(true)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    setIsAnimating(true)
    startTimeRef.current = null

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      
      if (progress < 1) {
        // During animation, show rolling random numbers
        if (progress < 0.7) {
          const randomDigits = Math.floor(Math.random() * endValue * 1.5)
          setDisplayValue(prefix + randomDigits.toLocaleString('id-ID') + suffix)
        } else {
          // Settle into final value
          const currentValue = Math.floor(easeOutQuart * endValue)
          setDisplayValue(prefix + currentValue.toLocaleString('id-ID') + suffix)
        }
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(prefix + endValue.toLocaleString('id-ID') + suffix)
        setIsAnimating(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [endValue, duration, prefix, suffix])

  return { displayValue, isAnimating }
}

function AnimatedStatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendUp,
  gradient,
  iconBg,
  iconColor,
  delay = 0,
}: {
  title: string
  value: number
  description: string
  icon: React.ElementType
  trend: string
  trendUp: boolean
  gradient: string
  iconBg: string
  iconColor: string
  delay?: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const { displayValue, isAnimating } = useAnimatedCounter(value, 2000 + delay)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <Card 
      className={cn(
        'group relative overflow-hidden border border-border/40 bg-card/90 shadow-sm transition-all duration-500 hover:border-white/8 hover:shadow-[0_18px_40px_rgba(0,0,0,0.16)] hover:-translate-y-1 backdrop-blur-sm',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 transition-opacity group-hover:opacity-70', gradient)} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground/90">{title}</p>
            <div className="space-y-1">
              <p className={cn(
                'text-3xl font-bold tracking-tight text-foreground transition-all',
                isAnimating && 'text-muted-foreground/70'
              )}>
                {displayValue}
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className={cn(
            'flex size-11 items-center justify-center rounded-xl border border-white/8 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg',
            iconBg
          )}>
            <Icon className={cn('size-5', iconColor)} />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-3">
          <div className="flex items-center gap-1.5">
          {trendUp ? (
            <ArrowUpRight className="size-3.5 text-emerald-600" />
          ) : (
            <ArrowDownRight className="size-3.5 text-red-600" />
          )}
          <span className={cn('text-xs font-medium', trendUp ? 'text-emerald-600' : 'text-red-600')}>
            {trend}
          </span>
          <span className="text-xs text-muted-foreground">vs bulan lalu</span>
          </div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">Live</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Munfiq',
      value: stats.totalKotak,
      description: 'Donatur terdaftar',
      icon: Users,
      trend: '+45',
      trendUp: true,
      gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Total Setoran',
      value: Math.round(stats.totalTerkumpul / 1000000),
      description: 'Juta rupiah terkumpul',
      icon: Coins,
      trend: '+12.5%',
      trendUp: true,
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Kecamatan Aktif',
      value: stats.totalKecamatan,
      description: `${stats.totalDesa} desa tercakup`,
      icon: MapPin,
      trend: '+3',
      trendUp: true,
      gradient: 'from-violet-500/10 via-violet-500/5 to-transparent',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Pending Validasi',
      value: stats.kotakPending,
      description: 'Menunggu verifikasi',
      icon: Clock,
      trend: '-8',
      trendUp: false,
      gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <AnimatedStatCard key={card.title} {...card} delay={index * 100} />
      ))}
    </div>
  )
}

export function RevenueCard({ stats }: StatsCardsProps) {
  const { user } = useAuth()
  const { scopedRoleLabel } = useAssignedGorutKecamatan()
  const [isVisible, setIsVisible] = useState(false)
  const [storedProfile, setStoredProfile] = useState(() => loadAccountProfile())
  const pointerGlowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setStoredProfile(loadAccountProfile())
  }, [])

  const dashboardAdminProfile = {
    name: user?.name ?? storedProfile.name,
    role: scopedRoleLabel ?? (user?.role ? roleDisplayNames[user.role] : storedProfile.role),
    session: 'Session aktif',
    lastAccess: 'Akses terakhir 2 menit lalu',
  }

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerGlowRef.current) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    pointerGlowRef.current.style.opacity = '1'
    pointerGlowRef.current.style.transform = `translate(${x - 120}px, ${y - 120}px)`
  }

  const handlePointerLeave = () => {
    if (!pointerGlowRef.current) return

    pointerGlowRef.current.style.opacity = '0'
    pointerGlowRef.current.style.transform = 'translate(58%, 18%)'
  }

  return (
    <Card 
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      className={cn(
        'group relative overflow-hidden border border-emerald-400/15 bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 text-white shadow-[0_24px_60px_rgba(16,185,129,0.22)] transition-all duration-500 hover:shadow-[0_32px_72px_rgba(16,185,129,0.28)]',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      {/* Decorative elements */}
      <div className="absolute -right-12 -top-12 size-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/5 blur-xl" />
      <div className="absolute right-4 top-4 size-20 rounded-full bg-white/5" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_30%,transparent_70%,rgba(255,255,255,0.04))] opacity-70" />
      <div
        ref={pointerGlowRef}
        className="pointer-events-none absolute left-0 top-0 size-60 rounded-full bg-white/10 blur-3xl opacity-0 transition-[opacity,transform] duration-300"
        style={{ transform: 'translate(58%, 18%)' }}
      />
      
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <CardContent className="relative p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/20 backdrop-blur-sm shadow-lg">
                <Coins className="size-6" />
              </div>
              <div>
                <p className="font-semibold opacity-95">Total Terkumpul</p>
                <p className="text-xs opacity-75">Sejak program dimulai</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold tracking-tight drop-shadow-lg">
                {formatRupiah(stats.totalTerkumpul)}
              </p>
              <p className="text-sm opacity-80">
                Bulan ini: <span className="font-semibold">{formatRupiah(stats.terkumpulBulanIni)}</span>
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm transition-all duration-300 group-hover:bg-black/15">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Saldo Bulan Ini</p>
                <p className="mt-2 text-lg font-semibold">{formatRupiah(stats.terkumpulBulanIni)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm transition-all duration-300 group-hover:bg-black/15">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Pertumbuhan</p>
                <p className="mt-2 text-lg font-semibold">+{stats.pertumbuhan}%</p>
              </div>
            </div>
          </div>
          <div className="flex w-full max-w-[320px] flex-col gap-3 self-start lg:items-end">
            <div className="flex items-center gap-2 self-start rounded-full border border-white/12 bg-white/20 px-4 py-2 backdrop-blur-sm lg:self-end">
              <TrendingUp className="size-4" />
              <span className="text-sm font-bold">+{stats.pertumbuhan}%</span>
            </div>

            <div className="relative w-full overflow-hidden rounded-[28px] border border-white/12 bg-black/10 p-4 backdrop-blur-md shadow-[0_16px_36px_rgba(0,0,0,0.16)] transition-all duration-300 group-hover:bg-black/15 group-hover:shadow-[0_20px_42px_rgba(0,0,0,0.2)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="absolute -right-8 -top-10 size-28 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="space-y-3">
                  <div className="grid h-[76px] w-[76px] shrink-0 grid-cols-5 gap-1 rounded-2xl border border-white/12 bg-white/95 p-2 shadow-lg">
                    {Array.from({ length: 25 }).map((_, index) => {
                    const activeCells = new Set([0, 1, 3, 4, 5, 9, 10, 12, 14, 15, 19, 20, 21, 23, 24])

                    return (
                      <span
                        key={index}
                        className={cn(
                          'rounded-[3px]',
                          activeCells.has(index) ? 'bg-emerald-600' : 'bg-emerald-100'
                        )}
                      />
                    )
                  })}
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-white/12 bg-white/15 text-sm font-semibold text-white shadow-lg">
                    {dashboardAdminProfile.name.charAt(0)}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-white/80" />
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/65">Profil Saya</span>
                    </div>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
                      Online
                    </span>
                  </div>
                  <p className="mt-2 truncate text-base font-semibold text-white">{dashboardAdminProfile.name}</p>
                  <p className="mt-1 text-xs text-white/70">{dashboardAdminProfile.role}</p>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-[11px] text-white/70 backdrop-blur-sm">
                    <p>{dashboardAdminProfile.session}</p>
                    <p className="mt-1 text-white/55">{dashboardAdminProfile.lastAccess}</p>
                  </div>

                  <Link
                    href="/gorut/profil"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3.5 py-2 text-xs font-medium text-white transition-all duration-300 hover:bg-white/15 hover:shadow-[0_10px_24px_rgba(255,255,255,0.08)]"
                  >
                    Ke Profil Saya
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
