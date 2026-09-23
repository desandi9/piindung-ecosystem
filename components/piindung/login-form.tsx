"use client"

import { type FormEvent, useEffect, useState } from "react"
import { Phone, Lock, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { resolvePostLoginNavigation, shouldPrefetchPostLoginDestination, type LoginPresentation } from "@/lib/login-presentation"
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
  const [isDirectNavigating, setIsDirectNavigating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isGorutMobile = presentation.kind === "gorut-mobile"
  const navigation = resolvePostLoginNavigation(presentation)
  const shouldPrefetch = shouldPrefetchPostLoginDestination(presentation)

  useEffect(() => {
    if (!shouldPrefetch) return
    router.prefetch(navigation.destination)
  }, [navigation.destination, router, shouldPrefetch])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const result = await login(phoneNumber.trim(), password, { remember: rememberMe })
    if (result.success) {
      setErrorMessage(null)
      if (navigation.method === "replace") {
        setIsDirectNavigating(true)
        router.replace(navigation.destination)
        return
      }

      if (navigation.showDashboardTransition) {
        setIsTransitioning(true)
        onTransitionStart?.()
        await new Promise((resolve) => window.setTimeout(resolve, 1250))
      }
      router.push(navigation.destination)
    } else {
      setErrorMessage(result.error ?? "Nomor HP atau password tidak valid.")
    }

    setIsLoading(false)
  }

  return (
    <>
      <div
        className={cn("w-full mx-auto transition-all duration-500 ease-out data-[transitioning=true]:scale-[0.985] data-[transitioning=true]:opacity-80", isGorutMobile ? "max-w-none" : "max-w-md")}
        data-transitioning={isTransitioning}
        data-post-login-method={navigation.method}
      >
      {/* Logo */}
      {isGorutMobile ? (
        <div className="mb-9 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#eaf8f1]">
            <Image src="/gorut-logo-icon.png" alt="" width={1905} height={2000} className="h-11 w-auto" priority />
          </div>
          <div className="mt-4 text-[#08213b]">
            <strong className="block text-[1.65rem] font-bold leading-none tracking-[-0.03em]">GORUT</strong>
            <span className="mt-2 block text-xs font-medium text-[#527064]">Gerakan Koin NU Kabupaten Garut</span>
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
      <h1 className={cn("font-medium text-foreground", isGorutMobile ? "text-center text-[1.75rem] leading-tight tracking-[-0.025em] text-[#08213b]" : "text-center text-lg mb-8")}>
        {isGorutMobile ? "Masuk ke GORUT" : "Login Menggunakan No HP dan Password"}
      </h1>
      {isGorutMobile ? (
        <div className="mb-8 mt-3 text-center">
          <span className="inline-flex min-h-7 items-center rounded-full bg-[#eaf8f1] px-3 text-xs font-bold uppercase tracking-[0.08em] text-[#067a4c]">
            {presentation.actorLabel}
          </span>
          <p className="mx-auto mt-4 max-w-[20rem] text-[15px] leading-6 text-[#61706b]">
            Gunakan nomor HP dan password akun PIINDUNG Anda.
          </p>
        </div>
      ) : null}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Phone Number Input */}
        <div>
          {isGorutMobile ? <label htmlFor="login-phone" className="mb-2 block text-sm font-semibold text-[#25364a]">No. HP</label> : null}
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
              placeholder={isGorutMobile ? "Contoh: 0812 3456 7890" : "Nomor HP"}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={cn("h-14 pl-12 pr-4 text-base rounded-xl focus:border-[#07965d] focus:ring-[#07965d]/20", isGorutMobile ? "border-[#dfe7e3] bg-[#f8faf9] text-[#25364a] placeholder:text-[#68766f]" : "border-gray-200 bg-white")}
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          {isGorutMobile ? <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-[#25364a]">Password</label> : null}
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
              className={cn("h-14 pl-12 pr-14 text-base rounded-xl focus:border-[#07965d] focus:ring-[#07965d]/20", isGorutMobile ? "border-[#dfe7e3] bg-[#f8faf9] text-[#25364a] placeholder:text-[#68766f]" : "border-gray-200 bg-white")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]/40"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className={cn("text-sm leading-5 text-destructive", isGorutMobile && "rounded-xl bg-[#fdecec] px-4 py-3 text-[#a43f3f]")} role="alert">{errorMessage}</p>
        ) : null}

        {/* Remember Me */}
        <div className={cn("flex items-center gap-2", isGorutMobile && "min-h-11")}>
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            className="border-gray-300 data-[state=checked]:bg-[#07965d] data-[state=checked]:border-[#07965d]"
          />
          <label
            htmlFor="remember"
            className={cn("text-sm text-muted-foreground cursor-pointer", isGorutMobile && "text-[#52645e]")}
          >
            Ingat Saya
          </label>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          disabled={isLoading || isTransitioning || isDirectNavigating}
          className={cn("w-full h-14 text-base font-semibold rounded-xl text-white transition-colors disabled:opacity-70", isGorutMobile ? "bg-[#07965d] hover:bg-[#067a4c]" : "bg-[#2e8b57] hover:bg-[#257a4a]")}
        >
          {isGorutMobile
            ? isDirectNavigating ? "Membuka GORUT..." : isLoading ? "Memeriksa akun..." : "Masuk"
            : isTransitioning ? "Memuat Dashboard..." : isLoading ? "Loading..." : "Login"}
        </Button>
      </form>

      {/* Footer */}
      {isGorutMobile ? (
        <div className="mt-10 text-center text-xs leading-5 text-[#61706b]">
          <p>Terhubung dengan <strong className="font-semibold text-[#0f3460]">PIINDUNG</strong></p>
          <p>NU Care–LAZISNU Kabupaten Garut</p>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground mt-12">
          ©2026 — <span className="text-[#2e8b57] font-medium">NU Care Lazisnu Garut</span>
        </p>
      )}
      </div>
    </>
  )
}
