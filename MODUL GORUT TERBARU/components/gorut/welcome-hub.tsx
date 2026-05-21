'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DashboardAmbientBackground } from '@/components/gorut/dashboard-ambient-background'
import { cn } from '@/lib/utils'
import gorutLogoColored from '../../LOGO GORUT WARNA.png'
import gorutLogoWhite from '../../LOGO GORUT WHITE.png'

const guideSteps = [
  'Masuk ke dashboard utama untuk mengakses monitoring, approval, dan operasional harian.',
  'Gunakan notifikasi serta pusat validasi untuk menjaga respons tetap cepat dan terstruktur.',
  'Pantau wilayah, laporan, dan aktivitas sistem dari ekosistem GORUT yang terintegrasi.',
]

export function WelcomeHub() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isDark = resolvedTheme !== 'light'
  const activeLogo = isDark ? gorutLogoWhite : gorutLogoColored

  useEffect(() => {
    setMounted(true)
  }, [])

  const dashboardHref = '/gorut/dashboard'

  return (
    <div className="relative min-h-screen overflow-hidden bg-background cursor-default">
      <DashboardAmbientBackground active />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.08),transparent_28%),radial-gradient(circle_at_85%_75%,rgba(34,197,94,0.06),transparent_26%)] transition-all duration-500 ease-out" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl animate-pulse transition-all duration-500 ease-out" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/6 to-transparent" />

      <div className="relative flex min-h-screen flex-col items-center justify-between px-6 py-10 sm:px-10 sm:py-12">
        <div />

        <div className="flex w-full max-w-4xl flex-1 items-center justify-center">
            <div className="w-full text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-700 transition-all ease-out">
            <Badge className="mb-6 border border-emerald-500/15 bg-emerald-500/8 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-emerald-300 uppercase">
              Internal Enterprise Workspace
            </Badge>

            <div className="relative mx-auto mb-8 flex size-36 items-center justify-center sm:size-44">
              <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_65%)] opacity-70" />
              <div className="absolute inset-4 rounded-full border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent backdrop-blur-sm" />
              <Image
                src={mounted ? activeLogo : gorutLogoColored}
                alt="GORUT"
                width={156}
                height={156}
                className="relative h-auto w-[112px] object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.24)] sm:w-[132px]"
                priority
              />
            </div>

            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Selamat Datang di GORUT
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              Platform Monitoring dan Pengelolaan Gerakan Koin Infak NU Kabupaten Garut
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="min-w-52 rounded-xl bg-emerald-500 text-emerald-950 shadow-[0_0_24px_rgba(16,185,129,0.16)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_0_32px_rgba(16,185,129,0.24)] active:scale-[0.982] active:shadow-[0_0_18px_rgba(16,185,129,0.18)]"
              >
                <Link href={dashboardHref}>
                  <span className="inline-flex items-center gap-2">
                    Masuk Dashboard
                    <ArrowRight className="size-4 transition-transform duration-300" />
                  </span>
                </Link>
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="min-w-52 rounded-xl border-border/70 bg-background/40 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-emerald-500/25 hover:bg-muted/50 hover:shadow-[0_0_24px_rgba(16,185,129,0.08)] active:scale-[0.985]"
                  >
                    <BookOpen className="size-4" />
                    Panduan Sistem
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-border/70 bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Panduan Sistem GORUT</DialogTitle>
                    <DialogDescription>
                      Alur singkat untuk memulai operasional harian dengan cepat dan tetap terstruktur.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    {guideSteps.map((step, index) => (
                      <div key={step} className="flex gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-sm font-semibold text-emerald-300">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>

                  <DialogFooter>
                    <Button asChild className="rounded-xl bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
                      <Link href={dashboardHref}>Lanjut ke Dashboard</Link>
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-700 delay-150">
          <div className="space-y-1 text-center">
            <p className="text-xs tracking-[0.18em] text-muted-foreground/70 uppercase">
              © 2026 GORUT Ecosystem
            </p>
            <p className="text-[11px] text-muted-foreground/55">
              Gerakan Koin Infak NU Kabupaten Garut
            </p>
            <p className="text-[11px] text-muted-foreground/45">
              Powered by LAZISNU Garut
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
