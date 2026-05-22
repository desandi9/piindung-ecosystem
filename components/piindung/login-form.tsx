"use client"

import { type FormEvent, useEffect, useState } from "react"
import { Phone, Lock, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginTransitionScreen } from "@/components/piindung/login-transition-screen"

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
      await new Promise((resolve) => window.setTimeout(resolve, 1250))
      router.push("/dashboard")
    } else {
      setErrorMessage(result.error ?? "Nomor HP atau password tidak valid.")
    }

    setIsLoading(false)
  }

  return (
    <>
      {isTransitioning ? <LoginTransitionScreen /> : null}
      <div className="w-full max-w-md mx-auto transition-all duration-500 ease-out data-[transitioning=true]:scale-[0.985] data-[transitioning=true]:opacity-80" data-transitioning={isTransitioning}>
      {/* Logo */}
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

      {/* Login Title */}
      <h1 className="text-center text-lg font-medium text-foreground mb-8">
        Login Menggunakan No HP dan Password
      </h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Phone Number Input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Phone className="h-5 w-5" />
          </div>
          <Input
            type="tel"
            placeholder="Nomor HP"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="h-14 pl-12 pr-4 text-base rounded-xl border-gray-200 bg-white focus:border-[#2e8b57] focus:ring-[#2e8b57]/20"
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 pl-12 pr-12 text-base rounded-xl border-gray-200 bg-white focus:border-[#2e8b57] focus:ring-[#2e8b57]/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        {/* Remember Me */}
        <div className="flex items-center gap-2">
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
      <p className="text-center text-sm text-muted-foreground mt-12">
        ©2026 — <span className="text-[#2e8b57] font-medium">NU Care Lazisnu Garut</span>
      </p>
      </div>
    </>
  )
}
