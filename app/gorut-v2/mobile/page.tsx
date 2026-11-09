import type { Metadata } from "next"
import { GorutMobileEntry } from "@/components/gorut-v2/entry/gorut-mobile-entry"

export const metadata: Metadata = { title: "GORUT Mobile", description: "Gerakan Koin NU Garut" }

export default function GorutMobilePage() {
  return <GorutMobileEntry />
}
