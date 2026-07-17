"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function PublicThemeDefault() {
  const { setTheme } = useTheme()

  useEffect(() => {
    if (window.localStorage.getItem("theme")) return

    setTheme("light")
  }, [setTheme])

  return null
}
