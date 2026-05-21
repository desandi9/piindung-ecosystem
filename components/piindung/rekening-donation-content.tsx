"use client"

import { FormEvent, useState } from "react"
import Image from "next/image"
import {
  Check,
  ClipboardCheck,
  Copy,
  CreditCard,
  FileCheck,
  Landmark,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"

const donationAccounts = [
  {
    id: "kelembagaan",
    number: "1817754283",
    type: "Rekening Kelembagaan",
    name: "NU CARE-LAZISNU PCNU KAB. GARUT",
  },
  {
    id: "sosial",
    number: "1823136836",
    type: "Rekening Sosial",
    name: "NU CARE-LAZISNU PCNU KAB. GARUT",
  },
  {
    id: "bencana",
    number: "1823136564",
    type: "Rekening Bencana",
    name: "NU CARE-LAZISNU PCNU KAB. GARUT",
  },
]

function BniLogo() {
  return (
    <div className="flex items-center" aria-label="BNI">
      <Image src="/bni.png" alt="BNI" width={104} height={40} className="h-10 w-auto object-contain" style={{ width: "auto" }} priority={false} />
    </div>
  )
}

export function RekeningDonationContent() {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const copyAccountNumber = async (number: string, id: string) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(number)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = number
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }

    setCopiedAccount(id)
    window.setTimeout(() => setCopiedAccount(null), 1800)
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
        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {donationAccounts.map((account) => {
            const isCopied = copiedAccount === account.id

            return (
                <div
                  key={account.id}
                  className={cn(
                    "group relative flex h-full min-h-[290px] flex-col overflow-hidden rounded-[28px] border border-white/10",
                    "bg-[radial-gradient(circle_at_top_right,rgba(46,139,87,0.22),transparent_34%),linear-gradient(160deg,rgba(15,23,42,0.98),rgba(9,9,11,1)_62%)]",
                    "shadow-[0_18px_44px_rgba(0,0,0,0.26)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2e8b57]/35 hover:shadow-[0_24px_56px_rgba(10,18,14,0.42)] hover:saturate-[1.04]"
                  )}
                >
                  <div className="pointer-events-none absolute right-[-22px] top-[-22px] h-28 w-28 rounded-full border border-white/10 bg-white/[0.03] blur-[1px]" />
                  <div className="pointer-events-none absolute bottom-5 right-5 text-[11px] uppercase tracking-[0.24em] text-white/10">NU CARE</div>
                  <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent p-5 lg:p-6">
                   <div className="flex items-start justify-between gap-3">
                      <BniLogo />
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2e8b57]/25 bg-[#2e8b57]/10 transition-colors group-hover:bg-[#2e8b57]/20">
                        <CreditCard className="h-5 w-5 text-[#7ee2aa]" />
                      </div>
                    </div>
                    <div className="mt-8 flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold leading-tight text-zinc-100">
                      {account.type}
                      </p>
                      <span className="rounded-full border border-[#2e8b57]/20 bg-[#2e8b57]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7ee2aa]">Resmi</span>
                    </div>
                    <p className="mt-2 max-w-[30ch] text-xs leading-5 text-zinc-300/85 sm:text-zinc-400">
                      BNI a.n. {account.name}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col p-5 lg:p-6">
                    <div className="mb-5 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      <Landmark className="h-3.5 w-3.5 text-[#7ee2aa]" />
                      Rekening Transfer
                    </div>
                     <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm transition-all duration-300 group-hover:border-[#2e8b57]/18 group-hover:bg-black/25">
                       <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-400">
                         Nomor Rekening
                       </p>
                       <p className="break-words font-mono text-[30px] font-semibold leading-tight text-zinc-50">
                         {account.number}
                       </p>
                     </div>

                    <button
                    type="button"
                    onClick={() => copyAccountNumber(account.number, account.id)}
                    className={cn(
                       "mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-3",
                       "text-sm font-medium transition-all duration-200",
                        isCopied
                          ? "border border-[#2e8b57]/20 bg-[#2e8b57]/10 text-[#7ee2aa]"
                          : "bg-[#2e8b57] hover:bg-[#236b43] text-white hover:shadow-lg hover:shadow-[#2e8b57]/20"
                     )}
                   >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Salin Rekening
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
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
               <label htmlFor="nama-rekening" className="text-sm font-medium text-zinc-100">
                Nama Donatur
              </label>
               <input
                 id="nama-rekening"
                 type="text"
                 required
                 placeholder="Nama lengkap"
                  className="modal-input-surface mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
               />
            </div>

            <div>
               <label htmlFor="rekening-tujuan" className="text-sm font-medium text-zinc-100">
                Rekening Tujuan
              </label>
               <select
                 id="rekening-tujuan"
                 required
                  className="modal-input-surface mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
               >
                <option value="" className="bg-white text-zinc-900">Pilih rekening tujuan</option>
                {donationAccounts.map((account) => (
                  <option key={account.id} value={account.number} className="bg-white text-zinc-900">
                    {account.type} - {account.number}
                  </option>
                ))}
              </select>
            </div>

            <div>
               <label htmlFor="nominal-rekening" className="text-sm font-medium text-zinc-100">
                Nominal Transfer
              </label>
               <input
                 id="nominal-rekening"
                 type="text"
                 inputMode="numeric"
                 required
                 placeholder="Nominal sesuai transfer"
                  className="modal-input-surface mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
               />
            </div>

            <div>
              <label htmlFor="tanggal-rekening" className="text-sm font-medium text-zinc-100">
                Tanggal Transfer
              </label>
               <input
                 id="tanggal-rekening"
                 type="date"
                 required
                 className="modal-input-surface mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
               />
            </div>

            <div>
              <label htmlFor="bukti-rekening" className="text-sm font-medium text-zinc-100">
                Upload Bukti Transfer
              </label>
              <label className="modal-card modal-card-hover mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center">
                <Upload className="h-5 w-5 text-[#2e8b57]" />
                <span className="text-sm font-medium text-zinc-100">Pilih file bukti transfer</span>
                <span className="text-xs text-zinc-300/85 sm:text-zinc-400">PNG, JPG, atau PDF</span>
                <input id="bukti-rekening" type="file" accept="image/*,.pdf" required className="sr-only" />
              </label>
            </div>

            <div>
              <label htmlFor="catatan-rekening" className="text-sm font-medium text-zinc-100">
                Catatan Optional
              </label>
              <textarea
                id="catatan-rekening"
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
