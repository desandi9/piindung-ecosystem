"use client"

import Image from "next/image"

export function LoginTransitionScreen() {
  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-background/92 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(46,139,87,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(15,52,96,0.16),_transparent_34%)]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2e8b57]/10 blur-3xl" />

      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-[32px] border border-border/80 bg-card/88 p-8 text-center shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-[#2e8b57]/15 bg-white/90 shadow-lg shadow-[#2e8b57]/10 dark:bg-card">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PIINDUNG%20BIRU.-RwIMUrRjgQyDRv216W7LDokN9BO9L4.png"
              alt="PIINDUNG"
              width={96}
              height={96}
              className="login-transition-logo h-auto w-16"
              style={{ width: "4rem", height: "auto" }}
              priority
            />
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2e8b57]">PIINDUNG</p>
            <h2 className="text-2xl font-semibold text-foreground">Menyiapkan Dashboard</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Memuat pusat informasi dan kontrol Anda dengan pengalaman yang lebih halus dan nyaman.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-full bg-muted/80 p-1">
            <div className="login-transition-progress h-2 rounded-full bg-gradient-to-r from-[#2e8b57] via-[#3aa86a] to-[#0f3460]" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2e8b57] animate-pulse" />
            Mengalihkan secara aman ke dashboard
          </div>
        </div>
      </div>
    </div>
  )
}
