"use client"

import { FormEvent, useState } from "react"
import Image from "next/image"
import qrisImage from "@/QRIS.png"
import {
  Check,
  ClipboardCheck,
  Copy,
  FileCheck,
  Info,
  QrCode,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"

function parseAmount(value: string) {
  return Number(value.replace(/\D/g, "")) || 0
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function getUniqueCode(amount: number) {
  if (amount <= 0) return 0
  if (amount === 50000) return 123

  return ((Math.floor(amount / 1000) * 37 + 873) % 900) + 100
}

export function QrisDonationContent() {
  const [nominal, setNominal] = useState("")
  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const baseNominal = parseAmount(nominal)
  const uniqueCode = getUniqueCode(baseNominal)
  const totalNominal = baseNominal + uniqueCode

  const copyNominal = async () => {
    if (totalNominal <= 0) return

    const value = String(totalNominal)

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = value
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    window.setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <>
      {submitted && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#2e8b57]/20 bg-[#2e8b57]/10 p-4 text-[#2e8b57] transition-all duration-300">
          <Check className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Konfirmasi donasi berhasil dikirim</p>
            <p className="mt-0.5 text-xs text-zinc-300/85 sm:text-zinc-400">
              Tim kami akan melakukan verifikasi sesuai data transfer yang Anda kirimkan.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,9,11,0.98),rgba(12,18,14,0.98))] transition-all duration-300 hover:border-[#2e8b57]/30 hover:shadow-[0_24px_56px_rgba(0,0,0,0.34)]">
          <div className="p-4 lg:p-5 border-b border-border bg-gradient-to-r from-[#2e8b57]/10 to-[#2e8b57]/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-[#2e8b57]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">QRIS Payment</h2>
                    <p className="text-xs text-zinc-300/85 sm:text-zinc-400">NU CARE LAZISNU PCNU GARUT</p>
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-[#2e8b57]/10 text-[#2e8b57] rounded-full">
                Resmi
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-4 lg:p-6 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)] lg:items-center">
            <div className="space-y-4 text-center">
              <div className="mx-auto w-full max-w-[330px] rounded-[30px] border border-border/80 bg-white p-4 shadow-[0_20px_48px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2e8b57]/20 hover:shadow-[0_24px_54px_rgba(0,0,0,0.18)]">
                <Image
                  src={qrisImage}
                  alt="QRIS NU Care LAZISNU PCNU Garut"
                  className="h-auto w-full rounded-xl"
                  priority
                />
              </div>

              <div className="mx-auto max-w-[330px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-center gap-2 lg:justify-start">
                  <Info className="h-4 w-4 text-[#2e8b57]" />
                  <h3 className="text-sm font-semibold text-zinc-100">Instruksi Donasi</h3>
                </div>
                <div className="space-y-2 text-sm leading-6 text-zinc-300/85 sm:text-zinc-400">
                  <p>1. Masukkan nominal donasi untuk mendapatkan kode unik otomatis.</p>
                  <p>2. Scan QRIS lalu transfer sesuai nominal final yang muncul.</p>
                  <p>3. Setelah transfer berhasil, kirim bukti pada form konfirmasi di bawah.</p>
                  <p className="font-medium text-zinc-100">3 digit terakhir dipakai untuk mempermudah verifikasi donasi masuk.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm lg:p-6">
                <div className="mb-4 text-center lg:text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-400/90 sm:text-zinc-500">Hitung Nominal Final</p>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-100">Transfer sekali, verifikasi lebih cepat</h3>
                </div>
                <div>
                  <label htmlFor="nominal" className="text-sm font-medium text-zinc-100">
                    Nominal Donasi
                 </label>
                 <input
                  id="nominal"
                  type="text"
                  inputMode="numeric"
                  value={nominal}
                  onChange={(event) => setNominal(event.target.value.replace(/\D/g, ""))}
                   placeholder="Contoh: 50000"
                    className="modal-input-surface mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
                 />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-400">Kode unik</p>
                    <p className="text-2xl font-semibold leading-none text-zinc-100">
                      {uniqueCode > 0 ? uniqueCode : "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#2e8b57]/20 bg-[#2e8b57]/7 p-4">
                    <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-400">Nominal transfer</p>
                    <p className="text-xl font-semibold leading-tight text-[#2e8b57]">
                      {formatRupiah(totalNominal)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyNominal}
                  disabled={totalNominal <= 0}
                  className={cn(
                    "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-200",
                    copied
                      ? "bg-[#2e8b57]/10 text-[#2e8b57]"
                      : "bg-[#2e8b57] text-white hover:bg-[#236b43] hover:shadow-lg hover:shadow-[#2e8b57]/20",
                    totalNominal <= 0 && "cursor-not-allowed opacity-50 hover:bg-[#2e8b57] hover:shadow-none"
                  )}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Nominal Tersalin" : "Salin Nominal Transfer"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 transition-all duration-300 hover:border-[#2e8b57]/30 hover:shadow-md">
          <div className="p-4 lg:p-5 border-b border-border bg-gradient-to-r from-[#2e8b57]/10 to-[#2e8b57]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-[#2e8b57]" />
              </div>
              <div>
                 <h2 className="text-sm font-semibold text-zinc-100">Konfirmasi Donasi</h2>
                  <p className="text-xs text-zinc-300/85 sm:text-zinc-400">Kirim bukti transfer untuk proses verifikasi</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 lg:p-5 space-y-4">
            <div>
               <label htmlFor="nama" className="text-sm font-medium text-zinc-100">
                Nama Donatur
              </label>
              <input
                id="nama"
                type="text"
                required
                placeholder="Nama lengkap"
                  className="modal-input-surface mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
              />
            </div>

            <div>
               <label htmlFor="nominal-transfer" className="text-sm font-medium text-zinc-100">
                Nominal Transfer
              </label>
              <input
                id="nominal-transfer"
                type="text"
                inputMode="numeric"
                required
                value={totalNominal > 0 ? totalNominal : ""}
                readOnly
                placeholder="Nominal sesuai transfer"
                  className="modal-input-surface mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
              />
            </div>

            <div>
               <label htmlFor="tanggal-transfer" className="text-sm font-medium text-zinc-100">
                Tanggal Transfer
              </label>
              <input
                id="tanggal-transfer"
                type="date"
                required
                  className="modal-input-surface mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
              />
            </div>

            <div>
               <label htmlFor="bukti-transfer" className="text-sm font-medium text-zinc-100">
                Upload Bukti Transfer
              </label>
               <label className="modal-card modal-card-hover mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center">
                <Upload className="h-5 w-5 text-[#2e8b57]" />
                 <span className="text-sm font-medium text-zinc-100">Pilih file bukti transfer</span>
                  <span className="text-xs text-zinc-300/85 sm:text-zinc-400">PNG, JPG, atau PDF</span>
                <input id="bukti-transfer" type="file" accept="image/*,.pdf" required className="sr-only" />
              </label>
            </div>

            <div>
               <label htmlFor="catatan" className="text-sm font-medium text-zinc-100">
                Catatan Optional
              </label>
              <textarea
                id="catatan"
                rows={3}
                placeholder="Tulis catatan jika diperlukan"
                 className="modal-input-surface mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
              />
            </div>

            <div className="modal-card rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FileCheck className="h-5 w-5 text-[#2e8b57] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Status Verifikasi</p>
                  <p className="mt-1 text-xs text-zinc-300/85 sm:text-zinc-400">
                    Setelah dikirim, donasi akan berstatus menunggu verifikasi admin NU Care-LAZISNU Garut.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={cn(
                "flex items-center justify-center gap-2 w-full py-3 rounded-xl",
                "bg-[#2e8b57] hover:bg-[#236b43] text-white font-medium text-sm",
                "transition-all duration-200 hover:shadow-lg hover:shadow-[#2e8b57]/20"
              )}
            >
              <ClipboardCheck className="h-4 w-4" />
              Kirim Konfirmasi Donasi
            </button>
          </form>
        </section>
      </div>
    </>
  )
}
