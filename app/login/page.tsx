"use client"

import { LoginForm } from "@/components/piindung/login-form"
import { PromoPanel } from "@/components/piindung/promo-panel"
import { LoginTransitionScreen } from "@/components/piindung/login-transition-screen"
import { resolveLoginPresentation } from "@/lib/login-presentation"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const presentation = resolveLoginPresentation(searchParams.get("next"))

  if (presentation.kind === "gorut-mobile") {
    return (
      <main
        className="min-h-[100svh] overflow-x-hidden bg-[#f6f8f6] sm:px-6"
        data-login-presentation="gorut-mobile"
        data-mobile-actor={presentation.actorType.toLowerCase()}
      >
        <div className="mx-auto flex min-h-[100svh] w-full max-w-[430px] items-center bg-white px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:border-x sm:border-[#e4eae7] sm:px-8">
          <section className="w-full" aria-label={`Login GORUT ${presentation.actorLabel}`}>
            <LoginForm presentation={presentation} />
          </section>
        </div>
      </main>
    )
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
