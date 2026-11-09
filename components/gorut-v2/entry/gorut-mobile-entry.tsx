"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { LoginPresentation } from "@/lib/login-presentation"
import { loadEntryRoles, publicEntryPath, resolveEntryDestination } from "@/features/gorut-v2/entry-access"
import { StitchSplash } from "./stitch-splash"
import { StitchWelcome } from "./stitch-welcome"
import { StitchLogin } from "./stitch-login"
import { StitchReset } from "./stitch-reset"
import { stitchEntryFont } from "./stitch-entry-font"
import "./stitch-entry.css"

type Screen = "splash" | "welcome" | "login" | "reset"

export function GorutMobileEntry({ presentation, initialScreen = "splash", destination }: {
  presentation?: LoginPresentation
  initialScreen?: Screen
  destination?: string | null
}) {
  const router = useRouter()
  const { user, login } = useAuth()
  const [screen, setScreen] = useState<Screen>(presentation ? "login" : initialScreen)
  const [notice, setNotice] = useState<string | null>(null)
  const [dot, setDot] = useState(0)
  const [card, setCard] = useState<string | null>(null)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")
  const [error, setError] = useState<string | null>(null)
  const [nik, setNik] = useState("")
  const pending = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const busy = status === "loading"
  const requestedDestination = destination ?? (presentation?.kind === "gorut-mobile" ? presentation.safeDestination : null)

  useEffect(() => {
    if (screen !== "splash") return
    const timer = window.setTimeout(() => setScreen("welcome"), 5000)
    return () => window.clearTimeout(timer)
  }, [screen])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const enterMobile = useCallback(async (signal: AbortSignal) => {
    if (!user) return
    const roles = await loadEntryRoles(user, signal)
    const next = resolveEntryDestination(roles, requestedDestination)
    if (!next) throw new Error("Akun ini belum memiliki akses mobile GORUT. Hubungi pengurus untuk bantuan.")
    router.replace(next)
  }, [user, requestedDestination, router])

  useEffect(() => {
    if (status !== "success" || !user) return
    const controller = new AbortController()
    void enterMobile(controller.signal).catch((reason: unknown) => {
      if (controller.signal.aborted) return
      setError(reason instanceof Error ? reason.message : "Akses mobile belum dapat dimuat.")
      setStatus("idle")
      pending.current = false
    })
    return () => controller.abort()
  }, [status, user, enterMobile])

  function changeScreen(next: Screen) {
    if (pending.current) return
    setError(null)
    setNotice(null)
    setPassword("")
    setNik("")
    setScreen(next)
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true
    setStatus("loading")
    setError(null)
    const result = await login(identifier.trim(), password, { remember })
    if (result.success) {
      setPassword("")
      setStatus("success")
    } else {
      pending.current = false
      setStatus("idle")
      setError(result.error ?? "Nomor HP atau password tidak valid.")
    }
  }

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current) return
    const data = new FormData(event.currentTarget)
    pending.current = true
    setStatus("loading")
    setError(null)
    try {
      const response = await fetch("/api/site-contact", { cache: "no-store", signal: AbortSignal.timeout(15000) })
      if (!response.ok) throw new Error("Kontak pengurus belum dapat dimuat. Silakan coba lagi.")
      const payload = await response.json()
      const number = payload.contact?.contact?.whatsappNumber
      if (typeof number !== "string" || !/^\d{8,15}$/.test(number)) throw new Error("Nomor WhatsApp pengurus belum tersedia.")
      const message = `Assalamualaikum, Admin GORUT. Saya memerlukan bantuan pemulihan akun.\nNama: ${String(data.get("fullName")).trim()}\nNIK: ${nik}\nAlamat: ${String(data.get("address")).trim()}\nNo. WhatsApp / HP: ${String(data.get("phone")).trim()}`
      // Opens a user-reviewed draft; never sends a message or resets a password automatically.
      window.location.assign(`https://wa.me/${number}?text=${encodeURIComponent(message)}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tidak dapat membuka bantuan pemulihan akun.")
    } finally {
      pending.current = false
      setStatus("idle")
    }
  }

  function replayAnimation() {
    // Restart only CSS animation timing; controlled and uncontrolled form values stay intact.
    root.current?.getAnimations({ subtree: true }).forEach((animation) => { animation.currentTime = 0 })
    if (screen !== "splash") setNotice("Memutar ulang animasi masuk…")
  }

  const onGuest = () => { if (!pending.current) router.push(publicEntryPath) }
  const onLogin = () => changeScreen("login")

  return <div ref={root} className={`stitch-entry ${stitchEntryFont.variable}`} data-entry-screen={screen} data-login-presentation="gorut-mobile">
    {screen === "splash" ? <StitchSplash /> : null}
    {screen === "welcome" ? <StitchWelcome onReplay={replayAnimation} onLogin={onLogin} onGuest={onGuest} notice={notice} dot={dot} setDot={setDot} card={card} setCard={setCard} /> : null}
    {screen === "login" ? <StitchLogin onBack={() => changeScreen("welcome")} onHelp={() => setNotice("Untuk bantuan akun, pilih Lupa Password? Reset untuk menghubungi pengurus.")} onReset={() => changeScreen("reset")} onGuest={onGuest} onSubmit={submitLogin} notice={notice} busy={busy} error={error} identifier={identifier} setIdentifier={setIdentifier} password={password} setPassword={setPassword} visible={visible} setVisible={setVisible} remember={remember} setRemember={setRemember} status={status} /> : null}
    {screen === "reset" ? <StitchReset onReplay={replayAnimation} onBack={onLogin} onSubmit={submitReset} notice={notice} busy={busy} error={error} nik={nik} setNik={setNik} /> : null}
  </div>
}
