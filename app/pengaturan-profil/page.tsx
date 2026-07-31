"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "motion/react"
import {
  ArrowLeft,
  Camera,
  Fingerprint,
  IdCard,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { AvatarCropper } from "@/components/piindung/avatar-cropper"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motionEase } from "@/lib/motion"
import type { AccountProfile } from "@/lib/account-profile"

const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png"]
const MAX_AVATAR_SIZE = 10 * 1024 * 1024

function useReveal(delay = 0): Variants {
  const reduced = useReducedMotion()
  return {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduced ? { duration: 0 } : { duration: 0.7, delay, ease: motionEase },
    },
  }
}

export default function PengaturanProfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changing, setChanging] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const headerReveal = useReveal()
  const profileReveal = useReveal(0.05)
  const identityReveal = useReveal(0.1)
  const securityReveal = useReveal(0.15)

  useEffect(() => {
    void fetch("/api/account/profile", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setProfile(data.profile)
        setName(data.profile.name)
        setEmail(data.profile.email)
        setPhone(data.profile.phone)
        setAddress(data.profile.address ?? "")
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Profil belum dapat dimuat."))
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile() {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, address }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setProfile(data.profile)
      setMessage("Profil berhasil disimpan.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profil gagal disimpan.")
    } finally {
      setSaving(false)
    }
  }

  async function persistAvatar(avatar: string | null, successMessage: string) {
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error)
    setProfile(data.profile)
    setMessage(successMessage)
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (avatarInputRef.current) avatarInputRef.current.value = ""
    if (!file) return
    setError("")
    setMessage("")
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setError("Foto harus berupa JPG, JPEG, atau PNG.")
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError("Ukuran foto maksimal 10MB.")
      return
    }
    setPendingFile(file)
    setCropperOpen(true)
  }

  function closeCropper() {
    setCropperOpen(false)
    setPendingFile(null)
  }

  async function uploadAvatar(file: File) {
    setAvatarBusy(true)
    setError("")
    setMessage("")
    try {
      if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) throw new Error("Foto harus berupa JPG, JPEG, atau PNG.")
      if (file.size > MAX_AVATAR_SIZE) throw new Error("Ukuran foto maksimal 10MB.")

      const body = new FormData()
      body.set("file", file)
      body.set("folder", "avatar")
      if (profile?.avatar) body.set("previousUrl", profile.avatar)

      const upload = await fetch("/api/upload/image", { method: "POST", body })
      const uploaded = await upload.json()
      if (!upload.ok || typeof uploaded.url !== "string") throw new Error(uploaded.error ?? "Foto gagal diunggah.")

      await persistAvatar(uploaded.url, "Foto profil berhasil diperbarui.")
      closeCropper()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Foto gagal diunggah.")
    } finally {
      setAvatarBusy(false)
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true)
    setError("")
    setMessage("")
    try {
      await persistAvatar(null, "Foto profil berhasil dihapus.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Foto gagal dihapus.")
    } finally {
      setAvatarBusy(false)
    }
  }

  async function changePassword() {
    setChanging(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setMessage("Password berhasil diubah. Sesi ini telah diakhiri; silakan login kembali.")
      setTimeout(() => router.push("/login"), 1200)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password gagal diubah.")
    } finally {
      setChanging(false)
    }
  }

  const initials = profile?.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "PI"

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f9f6] dark:bg-[#07131f]">
      <Navbar />
      <main className="container mx-auto max-w-3xl flex-1 space-y-8 px-4 py-8 sm:py-10">
        <motion.header initial="hidden" animate="visible" variants={headerReveal}>
          <Link
            href="/profil"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#07965d] transition-colors hover:text-[#067a4c] dark:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Profil
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#08213b] dark:text-white sm:text-4xl">
            Pengaturan Profil
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6c7a89] dark:text-slate-300 sm:text-[15px]">
            Kelola informasi pribadi dan keamanan akun PIINDUNG Anda dari satu tempat.
          </p>
        </motion.header>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/70 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200/70 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            {message}
          </div>
        ) : null}

        {loading ? (
          <SettingsSkeleton />
        ) : profile ? (
          <div className="space-y-6">
            <motion.section
              initial="hidden"
              animate="visible"
              variants={profileReveal}
              aria-labelledby="settings-profile-heading"
              className="rounded-[28px] border border-[#dce8e2]/90 bg-white/90 p-6 shadow-[0_14px_36px_rgba(9,43,32,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1e2d]/85 sm:p-7"
            >
              <SectionHeader
                icon={UserRound}
                title="Informasi Profil"
                description="Perbarui nama, email, dan nomor HP Anda."
              />

              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#dce8e2]/70 bg-[#f8fbf9]/70 p-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={`Foto profil ${profile.name}`}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-md"
                  />
                ) : (
                  <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#08213b] to-[#07965d] text-xl font-bold text-white shadow-md">
                    {initials}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#08213b] dark:text-white">Foto Profil</p>
                  <p className="mt-0.5 text-sm leading-6 text-[#6c7a89] dark:text-slate-400">
                    Format JPG atau PNG, maksimal 10MB. Anda bisa menyesuaikan posisi dan ukurannya sebelum disimpan.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarBusy}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#07965d] to-[#0bbf78] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(7,150,93,0.24)] transition-all duration-300 hover:shadow-[0_12px_26px_rgba(7,150,93,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-[#07131f]"
                    >
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      {profile.avatar ? "Ganti Foto" : "Unggah Foto"}
                    </button>
                    {profile.avatar ? (
                      <button
                        type="button"
                        onClick={() => void removeAvatar()}
                        disabled={avatarBusy}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dce8e2] bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-red-300 dark:hover:bg-red-500/10 dark:focus-visible:ring-offset-[#07131f]"
                      >
                        {avatarBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        Hapus
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <Field id="name" label="Nama Lengkap" icon={UserRound}>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-11 rounded-xl border-[#dce8e2] bg-white focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-white/5"
                  />
                </Field>
                <Field id="email" label="Email" icon={Mail}>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 rounded-xl border-[#dce8e2] bg-white focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-white/5"
                  />
                </Field>
                <Field id="phone" label="Nomor HP" icon={Phone}>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="h-11 rounded-xl border-[#dce8e2] bg-white focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-white/5"
                  />
                </Field>
                <Field id="address" label="Alamat" icon={MapPin}>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    rows={3}
                    placeholder="Jalan, desa/kelurahan, kecamatan, kabupaten"
                    className="min-h-24 rounded-xl border-[#dce8e2] bg-white focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-white/5"
                  />
                </Field>
              </div>

              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={saving}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#07965d] to-[#0bbf78] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(7,150,93,0.24)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(7,150,93,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-[#07131f]"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </motion.section>

            <motion.section
              initial="hidden"
              animate="visible"
              variants={identityReveal}
              aria-labelledby="settings-identity-heading"
              className="rounded-[28px] border border-[#dce8e2]/90 bg-white/90 p-6 shadow-[0_14px_36px_rgba(9,43,32,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1e2d]/85 sm:p-7"
            >
              <SectionHeader
                icon={Fingerprint}
                title="Identitas Anggota"
                description="Nomor keanggotaan unik Anda di PIINDUNG."
              />
              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#dce8e2]/70 bg-[#f8fbf9]/70 p-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-2 font-mono text-lg font-semibold text-[#08213b] dark:text-white">
                  <Fingerprint className="h-4 w-4 text-[#07965d] dark:text-emerald-300" aria-hidden="true" />
                  {profile.memberId}
                </div>
                <Link
                  href="/profil/identitas"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dce8e2] bg-white px-5 text-sm font-semibold text-[#08213b] shadow-sm transition hover:border-[#07965d]/40 hover:bg-[#e7f7ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-emerald-500/10"
                >
                  <IdCard className="h-4 w-4" aria-hidden="true" />
                  Buka Kartu Identitas
                </Link>
              </div>
            </motion.section>

            <motion.section
              initial="hidden"
              animate="visible"
              variants={securityReveal}
              aria-labelledby="settings-security-heading"
              className="rounded-[28px] border border-[#dce8e2]/90 bg-white/90 p-6 shadow-[0_14px_36px_rgba(9,43,32,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1e2d]/85 sm:p-7"
            >
              <SectionHeader
                icon={ShieldCheck}
                title="Keamanan Akun"
                description="Setelah password diubah, sesi ini diakhiri dan Anda harus login kembali. Sesi pada perangkat lain tidak dicabut."
              />
              <div className="mt-6 space-y-4">
                <Field id="current-password" label="Password Saat Ini" icon={KeyRound}>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="h-11 rounded-xl border-[#dce8e2] bg-white focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-white/5"
                  />
                </Field>
                <Field id="new-password" label="Password Baru" icon={KeyRound}>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="h-11 rounded-xl border-[#dce8e2] bg-white focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-white/5"
                  />
                </Field>
                <Field id="confirm-password" label="Konfirmasi Password Baru" icon={KeyRound}>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-11 rounded-xl border-[#dce8e2] bg-white focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-white/5"
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => void changePassword()}
                disabled={changing}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#08213b] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(8,33,59,0.2)] transition-all duration-300 hover:bg-[#0a2d50] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#08213b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/15 dark:focus-visible:ring-offset-[#07131f]"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {changing ? "Mengubah..." : "Ubah Password"}
              </button>
            </motion.section>
          </div>
        ) : null}
      </main>
      <SimpleFooter />
      <AvatarCropper
        file={pendingFile}
        open={cropperOpen}
        busy={avatarBusy}
        onCancel={closeCropper}
        onConfirm={(cropped) => void uploadAvatar(cropped)}
      />
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-500/15 dark:text-emerald-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-[#08213b] dark:text-white sm:text-xl">{title}</h2>
        <p className="mt-0.5 text-sm leading-6 text-[#6c7a89] dark:text-slate-400">{description}</p>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string
  label: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-sm font-semibold text-[#08213b] dark:text-slate-200">
        <Icon className="h-3.5 w-3.5 text-[#07965d] dark:text-emerald-300" aria-hidden="true" />
        {label}
      </Label>
      {children}
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-[260px] animate-pulse rounded-[28px] border border-[#dce8e2]/90 bg-white/70 dark:border-white/10 dark:bg-[#0d1e2d]/70"
        />
      ))}
    </div>
  )
}
