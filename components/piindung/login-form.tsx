"use client"

import { type FormEvent, useEffect, useState } from "react"
import { Phone, Lock, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { LoginPresentation } from "@/lib/login-presentation"
import { cn } from "@/lib/utils"

export function LoginForm({ presentation, onTransitionStart }: { presentation: LoginPresentation; onTransitionStart?: () => void }) {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isGorutMobile = presentation.kind === "gorut-mobile"

  useEffect(() => {
    router.prefetch("/dashboard")
  }, [router])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const result = await login(phoneNumber.trim(), password, { remember: rememberMe })
    if (result.success) {
      setErrorMessage(null)
      setIsTransitioning(true)
      onTransitionStart?.()
      await new Promise((resolve) => window.setTimeout(resolve, 1250))
      router.push(presentation.safeDestination)
    } else {
      setErrorMessage(result.error ?? "Nomor HP atau password tidak valid.")
    }

    setIsLoading(false)
  }

  return (
    <>
      <div className={cn("w-full mx-auto transition-all duration-500 ease-out data-[transitioning=true]:scale-[0.985] data-[transitioning=true]:opacity-80", isGorutMobile ? "max-w-none" : "max-w-md")} data-transitioning={isTransitioning}>
      {/* Logo */}
      {isGorutMobile ? (
        <div className="mb-8 flex items-center justify-between gap-5">
          <Image src="/piindung-logo-blue.png" alt="PIINDUNG" width={999} height={314} className="h-auto w-[132px]" priority />
          <div className="flex items-center gap-2.5 text-[#0f3460]">
            <Image src="/gorut-logo-icon.png" alt="" width={1905} height={2000} className="h-9 w-auto" priority />
            <div className="leading-none"><strong className="block text-base tracking-[-0.02em]">GORUT</strong><span className="mt-1 block text-[10px] font-medium text-[#3d6457]">Gerakan Koin NU</span></div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mb-10">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PIINDUNG%20BIRU.-RwIMUrRjgQyDRv216W7LDokN9BO9L4.png"
            alt="PIINDUNG - Pusat Instalasi dan Informasi Donasi Unggulan Nahdliyyin Garut"
            width={380}
            height={120}
            className="h-auto w-full max-w-[380px]"
            style={{ width: "100%", height: "auto" }}
            priority
          />
        </div>
      )}

      {/* Login Title */}
      <h1 className={cn("font-medium text-foreground", isGorutMobile ? "text-[1.75rem] leading-tight tracking-[-0.025em]" : "text-center text-lg mb-8")}>
        {isGorutMobile ? "Masuk ke GORUT" : "Login Menggunakan No HP dan Password"}
      </h1>
      {isGorutMobile ? <p className="mb-7 mt-2 text-[15px] leading-6 text-[#52645e]">Masuk sebagai <strong className="font-semibold text-[#1f6d4d]">{presentation.actorLabel}</strong> menggunakan akun PIINDUNG aktif Anda.</p> : null}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Phone Number Input */}
        <div>
          {isGorutMobile ? <label htmlFor="login-phone" className="mb-2 block text-sm font-medium text-[#253a33]">Nomor HP</label> : null}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </div>
            <Input
              id="login-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              aria-label={isGorutMobile ? undefined : "Nomor HP"}
              placeholder="Nomor HP"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-14 pl-12 pr-4 text-base rounded-xl border-gray-200 bg-white focus:border-[#2e8b57] focus:ring-[#2e8b57]/20"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          {isGorutMobile ? <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[#253a33]">Password</label> : null}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-label={isGorutMobile ? undefined : "Password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 pl-12 pr-14 text-base rounded-xl border-gray-200 bg-white focus:border-[#2e8b57] focus:ring-[#2e8b57]/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e8b57]/40"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="text-sm leading-5 text-destructive" role="alert">{errorMessage}</p>
        ) : null}

        {/* Remember Me */}
        <div className={cn("flex items-center gap-2", isGorutMobile && "min-h-11")}>
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            className="border-gray-300 data-[state=checked]:bg-[#2e8b57] data-[state=checked]:border-[#2e8b57]"
          />
          <label
            htmlFor="remember"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Ingat Saya
          </label>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          disabled={isLoading || isTransitioning}
          className="w-full h-14 text-base font-semibold rounded-xl bg-[#2e8b57] hover:bg-[#257a4a] text-white transition-colors disabled:opacity-70"
        >
          {isTransitioning ? "Memuat Dashboard..." : isLoading ? "Loading..." : "Login"}
        </Button>
      </form>

      {/* Footer */}
      {isGorutMobile ? (
        <div className="mt-8 text-center text-xs leading-5 text-[#61726c]"><p>Satu akun PIINDUNG untuk layanan GORUT</p><p className="font-medium text-[#315e4e]">NU Care–LAZISNU Kabupaten Garut</p></div>
      ) : (
        <p className="text-center text-sm text-muted-foreground mt-12">
          ©2026 — <span className="text-[#2e8b57] font-medium">NU Care Lazisnu Garut</span>
        </p>
      )}
      </div>
    </>
  )
}
