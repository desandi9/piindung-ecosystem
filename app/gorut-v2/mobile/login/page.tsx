import type { Metadata } from "next"
import { GorutMobileEntry } from "@/components/gorut-v2/entry/gorut-mobile-entry"
import { safeMobileDestination } from "../../../../lib/gorut/mobile-entry-routes"

export const metadata: Metadata = { title: "Masuk — GORUT Mobile" }

export default async function GorutMobileLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <GorutMobileEntry initialScreen="login" destination={safeMobileDestination(next)} />
}
