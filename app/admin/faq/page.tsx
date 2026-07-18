"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard"

export default function FaqRetiredPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/member-area/konten/bantuan")
  }, [router])

  return (
    <DashboardLayout>
      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
        Mengalihkan ke Pusat Bantuan Member Area...
      </div>
    </DashboardLayout>
  )
}
