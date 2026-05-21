"use client"

import { useEffect } from "react"

let lockCount = 0
const originalOverflow = typeof document !== "undefined" ? document.body.style.overflow : ""

export function useLockBodyScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return

    lockCount += 1
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow || originalOverflow || ""
      }
    }
  }, [enabled])
}
