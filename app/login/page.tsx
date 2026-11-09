"use client"

import { LoginForm } from "@/components/piindung/login-form"
import { PromoPanel } from "@/components/piindung/promo-panel"
import { LoginTransitionScreen } from "@/components/piindung/login-transition-screen"
import { GorutMobileEntry } from "@/components/gorut-v2/entry/gorut-mobile-entry"
import { resolveLoginPresentation } from "@/lib/login-presentation"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const presentation = resolveLoginPresentation(searchParams.get("next"))

  if (presentation.kind === "gorut-mobile") {
    return <GorutMobileEntry presentation={presentation} />
  }

  return (
    <>
      {isTransitioning && <LoginTransitionScreen />}
      <main className="min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
          <LoginForm presentation={presentation} onTransitionStart={() => setIsTransitioning(true)} />
        </div>

        {/* Right Side - Promotional Panel */}
        <div className="hidden lg:block lg:w-1/2">
          <PromoPanel />
        </div>
      </main>
    </>
  )
}
