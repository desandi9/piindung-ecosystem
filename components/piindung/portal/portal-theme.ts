"use client"

import { useCallback, useState } from "react"

const STORAGE_KEY = "piindung-dashboard-theme"
type PortalTheme = "light" | "dark"

/**
 * Tema khusus dashboard. Disimpan terpisah dari kunci "theme" milik next-themes karena
 * applySystemSettings menulis ulang kunci itu dengan colorMode situs di setiap pemuatan.
 * Tanpa pilihan tersimpan, dashboard mengikuti class `dark` situs. Komponen ini hanya
 * dirender di klien (setelah sesi termuat), jadi aman membaca localStorage saat inisialisasi.
 */
export function usePortalTheme() {
  const [theme, setTheme] = useState<PortalTheme>(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === "light" || stored === "dark") return stored
    } catch {
      // Penyimpanan diblokir: pakai tema situs.
    }
    return document.documentElement.classList.contains("dark") ? "dark" : "light"
  })

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark"
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Tetap berlaku untuk sesi ini walau tidak tersimpan.
      }
      return next
    })
  }, [])

  return { dark: theme === "dark", toggle }
}
