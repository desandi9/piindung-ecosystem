"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react"
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Fingerprint,
  Mail,
  MapPin,
  Phone,
  Printer,
  RotateCw,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Identity = {
  memberId: string
  name: string
  phone: string
  email: string
  role: string
  status: string
  avatar: string | null
  organization: string
  address?: string
  joinedAt: string
  verificationUrl: string
  qrUrl: string
}

const joinedLabel = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value)) : "—"

const initialsOf = (name: string) =>
  name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "PI"

export default function MemberIdentityPage() {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<"id" | "link" | null>(null)

  useEffect(() => {
    void fetch("/api/member-identity/me", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setIdentity(data)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Identitas belum dapat dimuat."))
  }, [])

  const copy = (value: string, key: "id" | "link") => {
    void navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b from-[#0a1c30] via-[#0d2740] to-[#08131f] px-4 py-10 print:min-h-0 print:bg-white print:p-0">
      {/* Ambient background — hidden on print */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden print:hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-teal-400/15 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#0bbf78]/10 blur-[120px]" />
      </div>

      <Link
        href="/profil"
        className="relative z-10 mb-8 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-white/70 transition-colors hover:text-white print:hidden"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke Profil
      </Link>

      {error ? (
        <div
          role="alert"
          className="relative z-10 rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-medium text-red-100 print:hidden"
        >
          {error}
        </div>
      ) : null}

      {!identity && !error ? (
        <div className="relative z-10 h-[440px] w-full max-w-[420px] animate-pulse rounded-[28px] border border-white/10 bg-white/5 print:hidden" />
      ) : null}

      {identity ? (
        <>
        <div className="relative z-10 flex w-full flex-col items-center print:hidden">
          <IdentityCard identity={identity} initials={initialsOf(identity.name)} />

          <p className="mt-6 max-w-[420px] rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs leading-6 text-white/60 print:hidden">
            <strong className="font-semibold text-white/80">Perhatian:</strong> QR ini digunakan untuk memeriksa
            keabsahan identitas anggota. QR bukan token login dan tidak memberikan akses ke modul operasional.
          </p>

          <div className="mt-6 grid w-full max-w-[420px] grid-cols-2 gap-3 print:hidden">
            <button
              type="button"
              onClick={() => copy(identity.memberId, "id")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {copied === "id" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied === "id" ? "Tersalin" : "Salin ID"}
            </button>
            <button
              type="button"
              onClick={() => copy(identity.verificationUrl, "link")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {copied === "link" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied === "link" ? "Tersalin" : "Salin Tautan"}
            </button>
            <Link
              href={identity.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <ExternalLink className="h-4 w-4" />
              Verifikasi
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#07965d] to-[#0bbf78] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(7,150,93,0.35)] transition-all hover:shadow-[0_14px_30px_rgba(7,150,93,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Printer className="h-4 w-4" />
              Cetak
            </button>
          </div>
        </div>

        <PrintSheet identity={identity} initials={initialsOf(identity.name)} />
        </>
      ) : null}
    </div>
  )
}

const CARD_SHELL =
  "absolute inset-0 flex flex-col overflow-hidden rounded-[28px] border border-white/15 bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] [backface-visibility:hidden] print:rounded-2xl print:border-slate-300 print:shadow-none"

function IdentityCard({ identity, initials }: { identity: Identity; initials: string }) {
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(py, [0, 1], [10, -10]), { stiffness: 200, damping: 18 })
  const rotateY = useSpring(useTransform(px, [0, 1], [-10, 10]), { stiffness: 200, damping: 18 })
  const glareBackground = useTransform(
    [px, py],
    ([x, y]) =>
      `radial-gradient(420px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(255,255,255,0.22), transparent 60%)`,
  )

  const interactive = !reduced

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }

  const resetPointer = () => {
    px.set(0.5)
    py.set(0.5)
  }

  const isActive = identity.status.toLowerCase().includes("aktif") || identity.status.toLowerCase() === "active"

  const details: Array<{ label: string; value: string; icon: React.ElementType; mono?: boolean }> = [
    { label: "Nama Lengkap", value: identity.name, icon: UserRound },
    { label: "Nomor HP", value: identity.phone || "Belum diatur", icon: Phone },
    { label: "Email", value: identity.email || "Belum diatur", icon: Mail },
    { label: "Alamat", value: identity.address || "Belum diatur", icon: MapPin },
    { label: "Bergabung", value: joinedLabel(identity.joinedAt), icon: CalendarClock },
    { label: "Member ID", value: identity.memberId, icon: Fingerprint, mono: true },
  ]

  return (
    // Tilt container — reacts to cursor, holds perspective
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      onClick={() => setFlipped((current) => !current)}
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 26, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduced ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={interactive ? { rotateX, rotateY, transformPerspective: 1100 } : undefined}
      className="group relative w-full max-w-[420px] cursor-pointer [transform-style:preserve-3d] print:max-w-none"
      role="button"
      tabIndex={0}
      aria-label={flipped ? "Kartu identitas — sisi detail. Ketuk untuk membalik." : "Kartu identitas — sisi depan. Ketuk untuk lihat detail."}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          setFlipped((current) => !current)
        }
      }}
    >
      {/* Flip container — front and back share the same box */}
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
        className="relative aspect-[540/856] w-full [transform-style:preserve-3d]"
      >
        {/* ===== FRONT ===== */}
        <div className={CARD_SHELL}>
          {/* Moving glare — screen only */}
          {interactive ? (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-100 print:hidden"
              style={{ background: glareBackground }}
            />
          ) : null}

          {/* Header band */}
          <div
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
            className="relative overflow-hidden bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] px-6 pb-16 pt-6 text-white print:from-[#0f3460] print:to-[#1a1a2e]"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 print:hidden">
              <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
              <div className="absolute right-16 top-4 h-16 w-16 rounded-full border border-white/10" />
            </div>
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-bold tracking-[0.22em]">PIINDUNG</p>
                <p className="mt-1 text-xs text-white/70">{identity.organization}</p>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
          </div>

          {/* Avatar overlapping the band */}
          <div className="relative -mt-12 flex justify-center px-6">
            <motion.div
              whileHover={interactive ? { scale: 1.04 } : undefined}
              transition={{ type: "spring", stiffness: 300, damping: 16 }}
              style={interactive ? { transform: "translateZ(40px)" } : undefined}
            >
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-2 ring-[#07965d]/30">
                <AvatarImage src={identity.avatar || undefined} alt={identity.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-[#08213b] to-[#07965d] text-2xl font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>

          {/* Body — mirrors the print/PDF front layout */}
          <div className="flex flex-1 flex-col items-center px-6 pb-4 pt-3 text-center">
            <h2 className="text-xl font-bold tracking-tight text-[#08213b]">{identity.name}</h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6c7a89]">
              {isActive ? (
                <span className="relative flex h-1.5 w-1.5 print:hidden">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#07965d] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#07965d]" />
                </span>
              ) : null}
              <span className="font-bold text-[#08213b]">{identity.role}</span>
              <span aria-hidden="true" className="text-[#c2cdd7]">·</span>
              <span className={isActive ? "text-[#07965d]" : "text-slate-500"}>{identity.status}</span>
            </p>

            {/* QR */}
            <div className="mt-4 rounded-2xl border border-[#dce8e2] bg-white p-3 shadow-sm">
              <img
                src={identity.qrUrl}
                alt={`QR verifikasi untuk ${identity.memberId}`}
                width={148}
                height={148}
                className="h-[148px] w-[148px] rounded-lg"
              />
            </div>
            <p className="mt-3 font-mono text-base font-bold tracking-wider text-[#08213b]">{identity.memberId}</p>

            <p className="mt-auto inline-flex items-center gap-1 pt-3 text-[10px] uppercase tracking-[0.14em] text-[#6c7a89] print:hidden">
              <RotateCw className="h-3 w-3" aria-hidden="true" />
              Ketuk kartu untuk detail
            </p>
          </div>

          {/* Bottom accent bar */}
          <div
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
            className="mt-auto h-2 w-full bg-gradient-to-r from-[#07965d] via-[#0bbf78] to-[#07965d]"
          />
        </div>

        {/* ===== BACK ===== */}
        <div className={`${CARD_SHELL} [transform:rotateY(180deg)] print:hidden`}>
          {/* Header band */}
          <div
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
            className="relative overflow-hidden bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] px-6 py-5 text-white"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -left-8 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-bold tracking-[0.22em]">DATA ANGGOTA</p>
                <p className="mt-1 text-xs text-white/70">{identity.organization}</p>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <RotateCw className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </div>

          {/* Detail list */}
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-6 py-5">
            {details.map((row) => {
              const Icon = row.icon
              return (
                <div key={row.label} className="flex items-start gap-3 rounded-2xl border border-[#dce8e2] bg-[#f8fbf9] p-3 text-left">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#07965d] shadow-sm">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c7a89]">{row.label}</p>
                    <p className={`mt-0.5 break-words font-semibold text-[#08213b] ${row.mono ? "font-mono text-sm" : "text-sm"}`}>
                      {row.value}
                    </p>
                  </div>
                </div>
              )
            })}
            <p className="mt-auto inline-flex items-center justify-center gap-1 pt-1 text-[10px] uppercase tracking-[0.14em] text-[#6c7a89]">
              <RotateCw className="h-3 w-3" aria-hidden="true" />
              Ketuk untuk kembali
            </p>
          </div>

          {/* Bottom accent bar */}
          <div
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
            className="mt-auto h-2 w-full bg-gradient-to-r from-[#07965d] via-[#0bbf78] to-[#07965d]"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Print-only layout. Renders front + back at CR80 ID-card size (54mm × 85.6mm,
 * the same footprint as a KTP/ATM card) so the output can be cut and used as a
 * physical card. All 3D/interactive chrome is dropped; colors are forced on.
 */
function PrintSheet({ identity, initials }: { identity: Identity; initials: string }) {
  const isActive = identity.status.toLowerCase().includes("aktif") || identity.status.toLowerCase() === "active"

  const details: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: "Nama", value: identity.name },
    { label: "Nomor HP", value: identity.phone || "Belum diatur" },
    { label: "Email", value: identity.email || "Belum diatur" },
    { label: "Alamat", value: identity.address || "Belum diatur" },
    { label: "Bergabung", value: joinedLabel(identity.joinedAt) },
    { label: "Member ID", value: identity.memberId, mono: true },
  ]

  return (
    <div className="hidden print:block">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          html, body { background: #ffffff !important; }
        }
        .pid-card {
          width: 54mm;
          height: 85.6mm;
          border-radius: 3.5mm;
          overflow: hidden;
          border: 0.3mm solid #cbd5e1;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          break-inside: avoid;
          page-break-inside: avoid;
          display: flex;
          flex-direction: column;
          color: #08213b;
          font-size: 7pt;
          line-height: 1.35;
        }
        .pid-band {
          background: linear-gradient(135deg, #0f3460, #16213e 60%, #1a1a2e);
          color: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pid-accent {
          background: linear-gradient(90deg, #07965d, #0bbf78, #07965d);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .pid-chip {
          background: #f8fbf9;
          border: 0.25mm solid #dce8e2;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>

      <div className="flex flex-wrap items-start justify-center gap-[8mm]">
        {/* ===== FRONT ===== */}
        <div className="pid-card">
          <div className="pid-band flex items-start justify-between px-[4mm] pb-[9mm] pt-[3.5mm]">
            <div>
              <p className="font-bold tracking-[0.18em]" style={{ fontSize: "7pt" }}>PIINDUNG</p>
              <p className="mt-[0.5mm] text-white/70" style={{ fontSize: "5pt" }}>{identity.organization}</p>
            </div>
            <ShieldCheck className="h-[5mm] w-[5mm] shrink-0" aria-hidden="true" />
          </div>

          <div className="-mt-[7mm] flex justify-center">
            <div className="h-[16mm] w-[16mm] overflow-hidden rounded-full border-[0.6mm] border-white bg-gradient-to-br from-[#08213b] to-[#07965d]" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {identity.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={identity.avatar} alt={identity.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-white" style={{ fontSize: "9pt" }}>
                  {initials}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center px-[4mm] pt-[1.5mm] text-center">
            <p className="font-bold" style={{ fontSize: "9pt" }}>{identity.name}</p>
            <p className="mt-[0.5mm]" style={{ fontSize: "6pt", color: isActive ? "#07965d" : "#64748b" }}>
              {identity.role} · {identity.status}
            </p>

            <div className="mt-[2mm] rounded-[1.5mm] bg-white p-[1.5mm]" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={identity.qrUrl} alt={`QR ${identity.memberId}`} className="h-[26mm] w-[26mm]" />
            </div>
            <p className="mt-[1mm] font-mono font-bold" style={{ fontSize: "7pt" }}>{identity.memberId}</p>
          </div>

          <div className="pid-accent h-[2mm] w-full" />
        </div>

        {/* ===== BACK ===== */}
        <div className="pid-card">
          <div className="pid-band flex items-center justify-between px-[4mm] py-[3mm]">
            <div>
              <p className="font-bold tracking-[0.18em]" style={{ fontSize: "6.5pt" }}>DATA ANGGOTA</p>
              <p className="mt-[0.5mm] text-white/70" style={{ fontSize: "5pt" }}>{identity.organization}</p>
            </div>
            <ShieldCheck className="h-[4.5mm] w-[4.5mm] shrink-0" aria-hidden="true" />
          </div>

          <div className="flex flex-1 flex-col gap-[1.5mm] px-[4mm] py-[3mm]">
            {details.map((row) => (
              <div key={row.label} className="pid-chip rounded-[1.5mm] px-[2mm] py-[1.2mm]">
                <p className="font-semibold uppercase tracking-[0.1em] text-[#6c7a89]" style={{ fontSize: "5pt" }}>{row.label}</p>
                <p className={`mt-[0.3mm] break-words font-semibold text-[#08213b] ${row.mono ? "font-mono" : ""}`} style={{ fontSize: "6.5pt" }}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          <div className="pid-accent h-[2mm] w-full" />
        </div>
      </div>
    </div>
  )
}
