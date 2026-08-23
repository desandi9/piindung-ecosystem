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
      <>
        {isTransitioning && <LoginTransitionScreen />}
        <main
          className="min-h-[100svh] bg-[#eef5f1] px-4 py-5 sm:px-6 sm:py-8"
          data-login-presentation="gorut-mobile"
          data-mobile-actor={presentation.actorType.toLowerCase()}
        >
          <div className="mx-auto flex min-h-[calc(100svh-2.5rem)] w-full max-w-[430px] items-center sm:min-h-[calc(100svh-4rem)]">
            <section className="w-full rounded-2xl bg-white px-5 py-7 shadow-[0_18px_48px_rgba(15,52,43,0.12)] sm:px-8 sm:py-9" aria-label={`Login GORUT ${presentation.actorLabel}`}>
              <LoginForm presentation={presentation} onTransitionStart={() => setIsTransitioning(true)} />
            </section>
          </div>
        </main>
      </>
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
