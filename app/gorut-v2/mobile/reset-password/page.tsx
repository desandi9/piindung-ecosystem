import type { Metadata } from "next"
import { GorutMobileEntry } from "@/components/gorut-v2/entry/gorut-mobile-entry"

export const metadata: Metadata = { title: "Reset Kata Sandi — GORUT Mobile" }

export default function GorutMobileResetPage() {
  return <GorutMobileEntry initialScreen="reset" />
}
