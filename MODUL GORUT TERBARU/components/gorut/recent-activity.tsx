'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Coins, CheckCircle, Box, Settings, ArrowRight, Clock, User } from 'lucide-react'
import type { Activity } from '@/lib/gorut/types'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RecentActivityProps {
  activities: Activity[]
}

const activityIcons = {
  setoran: Coins,
  validasi: CheckCircle,
  kotak_baru: Box,
  admin: Settings,
}

const activityColors = {
  setoran: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  validasi: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  kotak_baru: 'bg-violet-500/10 text-violet-600 ring-violet-500/20',
  admin: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Baru saja'
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} jam lalu`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'Kemarin'
  if (diffInDays < 7) return `${diffInDays} hari lalu`
  return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card 
      className={cn(
        'border border-border/40 bg-card/90 shadow-sm transition-all duration-500 backdrop-blur-sm',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <CardHeader className="flex-row items-center justify-between border-b border-border/40 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">Aktivitas Terkini</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Pembaruan sistem terbaru</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-lg text-xs text-muted-foreground hover:text-foreground">
          <Link href="/gorut/activity">
            Lihat Semua
            <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {activities.slice(0, 5).map((item, index) => {
          const Icon = activityIcons[item.type]
          const colorClass = activityColors[item.type]
          
          return (
            <div
              key={item.id}
              className={cn(
                'group relative flex items-start gap-4 rounded-xl border border-transparent bg-background/30 p-3 transition-all duration-300 hover:border-border/50 hover:bg-muted/30',
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              )}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              {/* Timeline connector */}
              {index !== activities.length - 1 && index !== 4 && (
                <div className="absolute bottom-0 left-[27px] top-14 w-px bg-border/50" />
              )}
              
              {/* Icon */}
              <div 
                className={cn(
                  'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full ring-4 ring-background transition-all duration-300 group-hover:scale-105',
                  colorClass
                )}
              >
                <Icon className="size-4" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full border border-border/50 bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {timeAgo(item.timestamp)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {item.user}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// Pending Validations Widget
export function PendingValidations({ count }: { count: number }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 400)
    return () => clearTimeout(timer)
  }, [])

  if (count === 0) return null

  return (
    <Card 
      className={cn(
        'group border border-amber-500/20 border-l-4 border-l-amber-500 bg-amber-500/5 shadow-sm transition-all duration-500 hover:shadow-[0_18px_40px_rgba(245,158,11,0.12)] hover:border-amber-500/30',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Perlu Validasi</CardTitle>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            {count} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Ada {count} setoran yang membutuhkan validasi segera.
        </p>
        <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white">
          <Link href="/gorut/validasi">
            Validasi Sekarang
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
