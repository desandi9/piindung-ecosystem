"use client"

import { LoginForm } from "@/components/piindung/login-form"
import { loginFont } from "@/components/piindung/login/login-font"
import { LoginScene } from "@/components/piindung/login/login-scene"
import { GorutMobileEntry } from "@/components/gorut-v2/entry/gorut-mobile-entry"
import { resolveLoginPresentation } from "@/lib/login-presentation"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const presentation = resolveLoginPresentation(searchParams.get("next"))

  if (presentation.kind === "gorut-mobile") {
    return <GorutMobileEntry presentation={presentation} />
  }

  return (
    // Desktop: adegan memenuhi layar, kartu form mengambang di kanan. Layar kecil: adegan jadi header, kartu di bawahnya.
    <main className={`${loginFont.className} relative min-h-dvh overflow-x-clip bg-[#e1f4c8] text-[#08213b] antialiased lg:h-dvh lg:min-h-[640px] lg:overflow-hidden`}>
      <div className="relative flex min-h-dvh flex-col lg:block lg:h-full lg:min-h-0">
        <LoginScene />
        <div className="login-card relative z-10 -mt-8 flex flex-1 justify-center rounded-t-[30px] bg-white px-5 pb-10 pt-9 shadow-[0_-20px_40px_-24px_rgba(16,48,30,.35)] sm:px-8 lg:absolute lg:inset-y-0 lg:right-6 lg:my-auto lg:h-[min(calc(100dvh-48px),780px)] lg:w-[min(460px,38vw)] lg:items-center lg:overflow-y-auto lg:rounded-[32px] lg:px-11 lg:py-10 lg:shadow-[0_30px_70px_-30px_rgba(16,48,30,.45)] xl:right-10">
          <LoginForm presentation={presentation} />
        </div>
      </div>
    </main>
  )
}
