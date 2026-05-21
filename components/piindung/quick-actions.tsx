"use client"

import * as ReactDOM from "react-dom"
import { useRef, useState, type FormEvent, type ReactElement } from "react"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BaseCenteredModal } from "@/components/piindung/base-centered-modal"
import { ModalFooter } from "@/components/piindung/modal-footer"
import { ModalHeader } from "@/components/piindung/modal-header"
import { addInboxMessage } from "@/lib/admin-inbox"
import { cn } from "@/lib/utils"
import { X, MessageCircle, Phone, Mail, Calendar, HelpCircle, ChevronRight, ExternalLink, Calculator, Wallet, Coins, TrendingUp, Search, CheckCircle2, Clock, CircleX, FileBarChart, ClipboardList, CalendarDays, Camera } from "lucide-react"
import { QrisDonationContent } from "@/components/piindung/qris-donation-content"
import { RekeningDonationContent } from "@/components/piindung/rekening-donation-content"
import { useContactSocialSettings, whatsappHref, normalizeWhatsApp } from "@/lib/contact-social"

function renderPortal(children: React.ReactNode) {
  if (typeof document === "undefined") return null
  return ReactDOM.createPortal(children, document.body)
}

// Custom icon components to match the reference
function KonsultasiIcon() {
  return (
    <svg className="w-7 h-7 text-[#2e8b57]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

function KalkulatorIcon() {
  return (
    <svg className="w-7 h-7 text-[#2e8b57]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
    </svg>
  )
}

function RekeningIcon() {
  return (
    <svg className="w-7 h-7 text-[#2e8b57]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  )
}

function QrisIcon() {
  return (
    <svg className="w-7 h-7 text-[#2e8b57]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
    </svg>
  )
}

function CekDonasiIcon() {
  return (
    <svg className="w-7 h-7 text-[#2e8b57]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
    </svg>
  )
}

function LaporanIcon() {
  return (
    <svg className="w-7 h-7 text-[#2e8b57]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

const quickActions = [
  {
    IconComponent: KonsultasiIcon,
    label: "Konsultasi Zakat",
    href: "#konsultasi",
    modalType: "konsultasi",
  },
  {
    IconComponent: KalkulatorIcon,
    label: "Kalkulator Zakat",
    href: "#kalkulator-zakat",
    modalType: "kalkulator",
  },
  {
    IconComponent: RekeningIcon,
    label: "Rekening Donasi",
    href: "#rekening-donasi",
    modalType: "rekening",
  },
  {
    IconComponent: QrisIcon,
    label: "QRIS Donasi",
    href: "#qris-donasi",
    modalType: "qris",
  },
  {
    IconComponent: CekDonasiIcon,
    label: "Cek Donasi",
    href: "#cek-donasi",
    modalType: "cek",
  },
  {
    IconComponent: LaporanIcon,
    label: "Laporan",
    href: "#laporan",
    modalType: "laporan",
  },
] as const

const laporanItems = [
  {
    icon: FileBarChart,
    title: "Laporan Program",
    description: "Laporan pelaksanaan program-program NU Care-LAZISNU Garut",
    href: "/laporan/program",
  },
  {
    icon: ClipboardList,
    title: "Laporan Kegiatan",
    description: "Laporan kegiatan dan aktivitas lembaga",
    href: "/laporan/kegiatan",
  },
  {
    icon: CalendarDays,
    title: "Laporan Tahunan",
    description: "Laporan tahunan dan pencapaian NU Care-LAZISNU Garut",
    href: "/laporan/tahunan",
  },
  {
    icon: Camera,
    title: "Dokumentasi",
    description: "Galeri foto dan video dokumentasi kegiatan",
    href: "/laporan/dokumentasi",
  },
]

// FAQ data for Konsultasi Zakat
const faqItems = [
  {
    question: "Apa itu zakat?",
    answer: "Zakat adalah rukun Islam ke-4 yang wajib dikeluarkan oleh setiap Muslim yang hartanya telah mencapai nisab."
  },
  {
    question: "Berapa nisab zakat?",
    answer: "Nisab zakat maal setara dengan 85 gram emas atau 595 gram perak."
  },
  {
    question: "Kapan waktu membayar zakat fitrah?",
    answer: "Zakat fitrah dibayarkan sejak awal Ramadhan hingga sebelum shalat Idul Fitri."
  },
]

// Konsultasi contact options
const konsultasiOptions = [
  {
    icon: MessageCircle,
    label: "WhatsApp Konsultasi",
    description: "Chat langsung dengan tim kami",
    href: "https://wa.me/6281234567890?text=Assalamualaikum,%20saya%20ingin%20konsultasi%20zakat",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    external: true,
  },
  {
    icon: Phone,
    label: "Call Center",
    description: "Hubungi (0262) 123-456",
    href: "tel:+620262123456",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    external: false,
  },
  {
    icon: Mail,
    label: "Email Admin",
    description: "admin@nucare-garut.or.id",
    href: "mailto:admin@nucare-garut.or.id?subject=Konsultasi%20Zakat",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    external: false,
  },
  {
    icon: Calendar,
    label: "Jadwalkan Konsultasi",
    description: "Buat janji temu online/offline",
    href: "/kontak",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    external: false,
  },
]

export function QuickActions() {
  const contactSettings = useContactSocialSettings()
  const [isKonsultasiOpen, setIsKonsultasiOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isRekeningOpen, setIsRekeningOpen] = useState(false)
  const [isQrisOpen, setIsQrisOpen] = useState(false)
  const [isCekDonasiOpen, setIsCekDonasiOpen] = useState(false)
  const [isLaporanOpen, setIsLaporanOpen] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const konsultasiOptions = [
    {
      icon: MessageCircle,
      label: "WhatsApp Konsultasi",
      description: "Chat langsung dengan tim kami",
      href: whatsappHref(contactSettings.whatsapp, "Assalamualaikum, saya ingin konsultasi zakat"),
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
      external: true,
    },
    {
      icon: Phone,
      label: "Call Center",
      description: `Hubungi ${contactSettings.whatsapp}`,
      href: `tel:+${normalizeWhatsApp(contactSettings.whatsapp)}`,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      external: false,
    },
    {
      icon: Mail,
      label: "Email Admin",
      description: contactSettings.email,
      href: `mailto:${contactSettings.email}?subject=Konsultasi%20Zakat`,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      external: false,
    },
    {
      icon: Calendar,
      label: "Jadwalkan Konsultasi",
      description: "Buat janji temu online/offline",
      href: whatsappHref(contactSettings.whatsapp, "Assalamualaikum, saya ingin menjadwalkan konsultasi zakat"),
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      external: true,
    },
  ]

  return (
    <>
      <div className="container mx-auto px-4 lg:px-8 py-4">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 lg:p-6 transition-colors duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 lg:gap-6">
            {quickActions.map((action) => (
              <QuickActionItem 
                key={action.label} 
                {...action} 
                onKonsultasiClick={() => setIsKonsultasiOpen(true)}
                onCalculatorClick={() => setIsCalculatorOpen(true)}
                onRekeningClick={() => setIsRekeningOpen(true)}
                onQrisClick={() => setIsQrisOpen(true)}
                onCekDonasiClick={() => setIsCekDonasiOpen(true)}
                onLaporanClick={() => setIsLaporanOpen(true)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Konsultasi Zakat Modal */}
      <KonsultasiModal 
        isOpen={isKonsultasiOpen}
        onOpen={() => setIsKonsultasiOpen(true)}
        onClose={() => setIsKonsultasiOpen(false)}
        expandedFaq={expandedFaq}
        setExpandedFaq={setExpandedFaq}
      />

      {/* Kalkulator Zakat Modal */}
      <KalkulatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Rekening Donasi Modal */}
      <RekeningDonasiModal
        isOpen={isRekeningOpen}
        onClose={() => setIsRekeningOpen(false)}
      />

      {/* QRIS Donasi Modal */}
      <QrisDonasiModal
        isOpen={isQrisOpen}
        onClose={() => setIsQrisOpen(false)}
      />

      {/* Cek Donasi Modal */}
      <CekDonasiModal
        isOpen={isCekDonasiOpen}
        onClose={() => setIsCekDonasiOpen(false)}
      />

      {/* Laporan Modal */}
      <LaporanModal
        isOpen={isLaporanOpen}
        onClose={() => setIsLaporanOpen(false)}
      />
    </>
  )
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function parseAmount(value: string) {
  return Number(value.replace(/\D/g, "")) || 0
}

function KalkulatorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [penghasilan, setPenghasilan] = useState("")
  const [harta, setHarta] = useState("")
  const [emas, setEmas] = useState("")

  const totalHarta = parseAmount(penghasilan) + parseAmount(harta) + parseAmount(emas)
  const estimasiZakat = totalHarta * 0.025

  const inputItems = [
    {
      label: "Penghasilan",
      value: penghasilan,
      onChange: setPenghasilan,
      icon: Wallet,
      placeholder: "Contoh: 5000000",
    },
    {
      label: "Harta/Tabungan",
      value: harta,
      onChange: setHarta,
      icon: TrendingUp,
      placeholder: "Contoh: 25000000",
    },
    {
      label: "Emas",
      value: emas,
      onChange: setEmas,
      icon: Coins,
      placeholder: "Nilai emas dalam rupiah",
    },
  ]

  return (
    <BaseCenteredModal open={isOpen} onClose={onClose} labelledBy="kalkulator-title" initialFocusRef={closeButtonRef} widthClassName="max-w-md max-h-[min(88vh,720px)] flex flex-col">
      <ModalHeader
        titleId="kalkulator-title"
        title="Kalkulator Hitung Zakat"
        description="Masukkan estimasi penghasilan, harta/tabungan, dan nilai emas untuk melihat perkiraan zakat yang perlu ditunaikan."
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        icon={<div className="w-14 h-14 rounded-full bg-[#2e8b57]/20 border-2 border-[#2e8b57]/30 flex items-center justify-center"><Calculator className="h-7 w-7 text-[#2e8b57]" /></div>}
        meta={<div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-sm text-green-600 dark:text-green-400 font-medium">Simulasi Zakat</span></div>}
      />

          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-3 mb-5">
              {inputItems.map((item) => (
                <label
                  key={item.label}
                 className="modal-card modal-card-hover block rounded-xl p-3"
                >
                   <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-100">
                    <span className="w-8 h-8 rounded-xl bg-[#2e8b57]/10 text-[#2e8b57] flex items-center justify-center">
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.value}
                    onChange={(event) => item.onChange(event.target.value.replace(/\D/g, ""))}
                    placeholder={item.placeholder}
                     className="modal-input-surface h-10 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
                  />
                </label>
              ))}
            </div>

             <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4 transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/10">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                   <p className="text-sm font-semibold text-zinc-100">Hasil Estimasi Zakat</p>
                   <p className="text-xs text-zinc-400">Simulasi 2,5% dari total nilai harta</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#2e8b57]/10 text-[#2e8b57] flex items-center justify-center">
                  <Calculator className="h-5 w-5" />
                </div>
              </div>
               <div className="modal-card rounded-xl p-4">
                 <p className="mb-1 text-xs text-zinc-400">Total harta terhitung</p>
                 <p className="mb-3 text-sm font-medium text-zinc-100">{formatRupiah(totalHarta)}</p>
                 <p className="mb-1 text-xs text-zinc-400">Estimasi zakat</p>
                <p className="text-2xl font-semibold text-[#2e8b57] transition-all duration-200">
                  {formatRupiah(estimasiZakat)}
                </p>
              </div>
            </div>
          </div>

          <ModalFooter>
            <button
              onClick={onClose}
              className={cn(
                "flex items-center justify-center gap-2 w-full py-3 rounded-xl",
                "bg-[#2e8b57] hover:bg-[#236b43] text-white font-medium text-sm",
                "transition-all duration-200 hover:shadow-lg hover:shadow-[#2e8b57]/20"
              )}
            >
              Tutup Simulasi
            </button>
          </ModalFooter>
    </BaseCenteredModal>
  )
}

function QrisDonasiModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  return (
    <BaseCenteredModal open={isOpen} onClose={onClose} labelledBy="qris-title" initialFocusRef={closeButtonRef} widthClassName="max-w-5xl max-h-[min(90vh,860px)] flex flex-col">
      <ModalHeader
        titleId="qris-title"
        title="QRIS Donasi"
        description="Scan QRIS, gunakan nominal dengan kode unik otomatis, lalu kirim konfirmasi donasi untuk proses verifikasi."
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        icon={<div className="w-14 h-14 rounded-full bg-[#2e8b57]/20 border-2 border-[#2e8b57]/30 flex items-center justify-center"><QrisIcon /></div>}
        meta={<div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-sm text-green-600 dark:text-green-400 font-medium">Konfirmasi Donasi</span></div>}
        className="relative border-b border-white/10 bg-[linear-gradient(135deg,rgba(9,9,11,0.96),rgba(24,24,27,0.98),rgba(4,120,87,0.22))] px-6 py-4"
      />

          <div className="flex-1 overflow-y-auto p-5">
            <QrisDonationContent />
          </div>
    </BaseCenteredModal>
  )
}

function RekeningDonasiModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  return (
    <BaseCenteredModal open={isOpen} onClose={onClose} labelledBy="rekening-title" initialFocusRef={closeButtonRef} widthClassName="max-w-6xl max-h-[min(90vh,860px)] flex flex-col">
      <ModalHeader
        titleId="rekening-title"
        title="Rekening Donasi"
        description="Pilih rekening resmi BNI NU Care-LAZISNU Garut, salin nomor rekening, lalu kirim konfirmasi donasi setelah transfer."
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        icon={<div className="w-14 h-14 rounded-full bg-[#2e8b57]/20 border-2 border-[#2e8b57]/30 flex items-center justify-center"><RekeningIcon /></div>}
        meta={<div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-sm text-green-600 dark:text-green-400 font-medium">Konfirmasi Donasi</span></div>}
        className="relative border-b border-white/10 bg-[linear-gradient(135deg,rgba(9,9,11,0.96),rgba(24,24,27,0.98),rgba(4,120,87,0.22))] px-6 py-4"
      />

          <div className="flex-1 overflow-y-auto p-5">
            <RekeningDonationContent />
          </div>
    </BaseCenteredModal>
  )
}

function CekDonasiModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [kodeDonasi, setKodeDonasi] = useState("")
  const [namaKontak, setNamaKontak] = useState("")
  const [status, setStatus] = useState<"berhasil" | "menunggu" | "tidak-ditemukan" | null>(null)

  const checkDonation = () => {
    const normalizedCode = kodeDonasi.trim().toLowerCase()

    if (!normalizedCode) {
      setStatus(null)
      return
    }

    if (normalizedCode.includes("wait") || normalizedCode.endsWith("2")) {
      setStatus("menunggu")
      return
    }

    if (normalizedCode.includes("404") || normalizedCode.endsWith("0")) {
      setStatus("tidak-ditemukan")
      return
    }

    setStatus("berhasil")
  }

  const statusContent = {
    berhasil: {
      icon: CheckCircle2,
      label: "Berhasil diproses",
      description: "Donasi Anda sudah tercatat dan berhasil diproses oleh sistem.",
      className: "border-[#2e8b57]/20 bg-[#2e8b57]/10 text-[#2e8b57]",
    },
    menunggu: {
      icon: Clock,
      label: "Menunggu verifikasi",
      description: "Donasi sudah diterima dan sedang menunggu verifikasi admin.",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    "tidak-ditemukan": {
      icon: CircleX,
      label: "Tidak ditemukan",
      description: "Kode donasi belum ditemukan. Pastikan kode yang Anda masukkan sudah benar.",
      className: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
    },
  }

  const currentStatus = status ? statusContent[status] : null

  return (
    <BaseCenteredModal open={isOpen} onClose={onClose} labelledBy="cek-donasi-title" initialFocusRef={closeButtonRef} widthClassName="max-w-md max-h-[min(88vh,720px)] flex flex-col">
      <ModalHeader
        titleId="cek-donasi-title"
        title="Cek Donasi"
        description="Masukkan kode donasi untuk melihat status proses donasi Anda secara cepat."
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        icon={<div className="w-14 h-14 rounded-full bg-[#2e8b57]/20 border-2 border-[#2e8b57]/30 flex items-center justify-center"><CekDonasiIcon /></div>}
        meta={<div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-sm text-green-600 dark:text-green-400 font-medium">Status Donasi</span></div>}
        className="relative border-b border-white/10 bg-[linear-gradient(135deg,rgba(9,9,11,0.96),rgba(24,24,27,0.98),rgba(4,120,87,0.22))] px-6 py-4"
      />

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="space-y-4">
               <label className="modal-card modal-card-hover block rounded-2xl p-4">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-100">
                   <span className="w-8 h-8 rounded-xl bg-[#2e8b57]/10 text-[#2e8b57] flex items-center justify-center">
                     <Search className="h-4 w-4" />
                  </span>
                  Kode Donasi
                </span>
                <input
                  type="text"
                  value={kodeDonasi}
                  onChange={(event) => setKodeDonasi(event.target.value)}
                   placeholder="Contoh: DN-2026-001"
                    className="modal-input-surface h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
                 />
               </label>

                <label className="modal-card modal-card-hover block rounded-2xl p-4">
                  <span className="mb-2 block text-sm font-medium text-zinc-100">
                   Nama/No HP Optional
                 </span>
                <input
                  type="text"
                  value={namaKontak}
                  onChange={(event) => setNamaKontak(event.target.value)}
                   placeholder="Nama atau nomor handphone"
                    className="modal-input-surface h-11 w-full rounded-xl border px-3 text-sm outline-none transition-all duration-200 focus:border-[#2e8b57]/50 focus:ring-2 focus:ring-[#2e8b57]/10"
                 />
               </label>

              <button
                type="button"
                onClick={checkDonation}
                className={cn(
                  "flex items-center justify-center gap-2 w-full py-3 rounded-xl",
                  "bg-[#2e8b57] hover:bg-[#236b43] text-white font-medium text-sm",
                  "transition-all duration-200 hover:shadow-lg hover:shadow-[#2e8b57]/20"
                )}
              >
                <Search className="h-4 w-4" />
                Cek Donasi
              </button>

              {currentStatus && (
                <div className={cn(
                  "rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                  currentStatus.className
                )}>
                  <div className="flex items-start gap-3">
                    <currentStatus.icon className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{currentStatus.label}</p>
                       <p className="mt-1 text-xs text-zinc-300/85">
                        {currentStatus.description}
                      </p>
                      {namaKontak && (
                         <p className="mt-2 text-xs text-zinc-300/85">
                          Data pencarian: {namaKontak}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
    </BaseCenteredModal>
  )
}

function LaporanModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  return (
    <BaseCenteredModal open={isOpen} onClose={onClose} labelledBy="laporan-title" initialFocusRef={closeButtonRef} widthClassName="max-w-2xl max-h-[90vh] flex flex-col">
      <ModalHeader
        titleId="laporan-title"
        title="Laporan"
        description="Pilih jenis laporan NU Care-LAZISNU Garut untuk melihat informasi program, kegiatan, tahunan, dan dokumentasi."
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        icon={<div className="w-14 h-14 rounded-full bg-[#2e8b57]/20 border-2 border-[#2e8b57]/30 flex items-center justify-center"><LaporanIcon /></div>}
        meta={<div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-sm text-green-600 dark:text-green-400 font-medium">Akses Laporan</span></div>}
        className="relative border-b border-white/10 bg-[linear-gradient(135deg,rgba(9,9,11,0.96),rgba(24,24,27,0.98),rgba(4,120,87,0.22))] px-6 py-4"
      />

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
               {laporanItems.map((item) => (
                  <Link
                   key={item.title}
                   href={item.href}
                   onClick={onClose}
                     className={cn(
                       "group flex flex-col rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition-all duration-300",
                       "hover:-translate-y-1 hover:border-[#2e8b57]/25 hover:shadow-[0_22px_48px_rgba(0,0,0,0.26)]"
                     )}
                   >
                   <div className="mb-3 flex items-start justify-between">
                     <div className={cn(
                       "flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2e8b57]/10",
                       "group-hover:bg-[#2e8b57]/20 transition-colors"
                     )}>
                       <item.icon className="h-5 w-5 text-[#2e8b57]" />
                     </div>
                     <ChevronRight className="h-4 w-4 text-zinc-500 transition-transform duration-300 group-hover:translate-x-0.5" />
                   </div>
                    <h3 className="mb-1 text-sm font-semibold text-zinc-100">{item.title}</h3>
                    <p className="line-clamp-2 text-xs leading-5 text-zinc-300/85 sm:text-zinc-400">{item.description}</p>
                 </Link>
               ))}
             </div>
           </div>
    </BaseCenteredModal>
  )
}

// Konsultasi Zakat Modal Component
function KonsultasiModal({ 
  isOpen, 
  onOpen,
  onClose,
  expandedFaq,
  setExpandedFaq
}: { 
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  expandedFaq: number | null
  setExpandedFaq: (index: number | null) => void
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "", message: "" })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<"idle" | "success">("idle")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.email.trim() && !form.phone.trim()) {
      setFormError("Isi email atau nomor WhatsApp agar admin dapat membalas.")
      return
    }

    addInboxMessage({
      source: "Konsultasi",
      title: form.topic.trim() || `Konsultasi dari ${form.name.trim()}`,
      senderName: form.name.trim(),
      senderEmail: form.email.trim(),
      senderPhone: form.phone.trim(),
      message: form.message.trim(),
    })

    setForm({ name: "", email: "", phone: "", topic: "", message: "" })
    setFormError(null)
    setSubmitState("success")
  }

  return renderPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[1200] flex justify-end p-4 sm:p-6"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="flex w-full max-w-[340px] flex-col items-end gap-3">
        <div
          id="konsultasi-widget"
          role="dialog"
          aria-labelledby="konsultasi-title"
          aria-hidden={!isOpen}
          className={cn(
            "pointer-events-auto flex w-full max-h-[500px] origin-bottom-right flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/95 text-slate-50 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-[2px] transition-all duration-300 ease-out",
            isOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-3 scale-[0.98] opacity-0"
          )}
        >
          <div className="relative border-b border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.94),rgba(4,120,87,0.24))] p-4">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
              aria-label="Minimize support panel"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-12">
              <div className="relative shrink-0">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/25 bg-emerald-500/10 shadow-[0_0_24px_rgba(46,139,87,0.18)]">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20LAZISNU-removebg-preview-suKxIrmOGFJA6ATfy2ALQ39z2qZtXy.png"
                    alt="Admin NU Care"
                    width={38}
                    height={38}
                    className="object-contain"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-emerald-300/80">
                  Support Assistant
                </p>
                <h2 id="konsultasi-title" className="mt-1 text-base font-semibold text-white">
                  Konsultasi Zakat
                </h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Online sekarang</span>
                  <span className="text-slate-500">•</span>
                  <span className="truncate">Tim siap membantu</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Assalamualaikum. Tim NU Care-LAZISNU Garut siap membantu konsultasi zakat, infaq, dan sedekah tanpa mengganggu tampilan dashboard Anda.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.96))] p-4">
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-white">Hubungi Tim Support</h3>
                  <p className="mt-1 text-xs text-slate-400">Pilih kanal yang paling nyaman untuk Anda.</p>
                </div>

                <div className="space-y-2">
                  {konsultasiOptions.map((option) => (
                    <Link
                      key={option.label}
                      href={option.href}
                      target={option.external ? "_blank" : undefined}
                      rel={option.external ? "noopener noreferrer" : undefined}
                      onClick={onClose}
                      className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-900/70 px-3 py-3 transition-all duration-200 hover:border-emerald-400/25 hover:bg-slate-900 hover:shadow-[0_12px_28px_rgba(15,23,42,0.32)]"
                    >
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", option.color)}>
                        <option.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-sm font-medium text-white">
                          <span className="truncate">{option.label}</span>
                          {option.external ? <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" /> : null}
                        </div>
                        <p className="truncate text-xs text-slate-400">{option.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-white">Kirim Pertanyaan</h3>
                  <p className="mt-1 text-xs text-slate-400">Pertanyaan Anda akan langsung masuk ke inbox Admin Dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Nama lengkap"
                    required
                    className="rounded-xl border-white/10 bg-slate-900/70 text-slate-50 placeholder:text-slate-400"
                  />

                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="Email aktif"
                      type="email"
                      className="rounded-xl border-white/10 bg-slate-900/70 text-slate-50 placeholder:text-slate-400"
                    />
                    <Input
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="Nomor WhatsApp"
                      className="rounded-xl border-white/10 bg-slate-900/70 text-slate-50 placeholder:text-slate-400"
                    />
                  </div>

                  <Input
                    value={form.topic}
                    onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
                    placeholder="Topik konsultasi"
                    className="rounded-xl border-white/10 bg-slate-900/70 text-slate-50 placeholder:text-slate-400"
                  />

                  <Textarea
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Tulis pertanyaan konsultasi Anda"
                    required
                    className="min-h-28 rounded-xl border-white/10 bg-slate-900/70 text-slate-50 placeholder:text-slate-400"
                  />

                  {formError ? <p className="text-xs text-rose-300">{formError}</p> : null}
                  {submitState === "success" ? <p className="text-xs text-emerald-300">Pertanyaan berhasil dikirim ke admin.</p> : null}

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2e8b57] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#236b43] hover:shadow-[0_14px_32px_rgba(46,139,87,0.28)]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Kirim Pertanyaan
                  </button>
                </form>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-300" />
                  <h3 className="text-sm font-semibold text-white">FAQ Zakat</h3>
                </div>

                <div className="space-y-2">
                  {faqItems.map((faq, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:border-emerald-400/20"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      >
                        <span className="pr-4 text-sm font-medium text-slate-100">{faq.question}</span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
                            expandedFaq === index && "rotate-90 text-emerald-300"
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-200",
                          expandedFaq === index ? "max-h-32" : "max-h-0"
                        )}
                      >
                        <p className="px-4 pb-4 text-sm leading-relaxed text-slate-400">{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950/95 p-4">
            <Link
              href="/konsultasi-zakat"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2e8b57] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#236b43] hover:shadow-[0_14px_32px_rgba(46,139,87,0.28)]"
            >
              <MessageCircle className="h-4 w-4" />
              Mulai Konsultasi Lengkap
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={isOpen ? onClose : onOpen}
          aria-expanded={isOpen}
          aria-controls="konsultasi-widget"
          className="pointer-events-auto group flex items-center gap-3 rounded-full border border-emerald-400/20 bg-slate-950/95 px-3 py-3 text-left text-slate-50 shadow-[0_20px_44px_rgba(0,0,0,0.38)] backdrop-blur-[2px] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/35 hover:shadow-[0_24px_52px_rgba(0,0,0,0.46)]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2e8b57] text-white shadow-[0_10px_24px_rgba(46,139,87,0.3)] transition-transform duration-200 group-hover:scale-[1.03]">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="pr-2">
            <span className="block text-sm font-semibold text-white">{isOpen ? "Tutup Bantuan" : "Butuh Bantuan?"}</span>
            <span className="block text-xs text-slate-400">{isOpen ? "Minimalkan panel support" : "Chat dengan tim LAZISNU"}</span>
          </span>
        </button>
      </div>
    </div>
  )
}

function QuickActionItem({ 
  IconComponent, 
  label, 
  href,
  modalType,
  onKonsultasiClick,
  onCalculatorClick,
  onRekeningClick,
  onQrisClick,
  onCekDonasiClick,
  onLaporanClick
}: { 
  IconComponent: () => ReactElement
  label: string
  href: string
  modalType?: "konsultasi" | "kalkulator" | "rekening" | "qris" | "cek" | "laporan"
  onKonsultasiClick?: () => void
  onCalculatorClick?: () => void
  onRekeningClick?: () => void
  onQrisClick?: () => void
  onCekDonasiClick?: () => void
  onLaporanClick?: () => void
}) {
  const modalHandlers = {
    konsultasi: onKonsultasiClick,
    kalkulator: onCalculatorClick,
    rekening: onRekeningClick,
    qris: onQrisClick,
    cek: onCekDonasiClick,
    laporan: onLaporanClick,
  }
  const onModalClick = modalType ? modalHandlers[modalType] : undefined

  if (onModalClick) {
    return (
      <button
        type="button"
        onClick={onModalClick}
        className={cn(
          "flex flex-col items-center gap-2 p-3 lg:p-4 rounded-xl",
          "hover:bg-accent transition-colors group"
        )}
      >
        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-card border-2 border-[#2e8b57]/20 flex items-center justify-center group-hover:border-[#2e8b57]/40 transition-colors">
          <IconComponent />
        </div>
        <span className="text-xs lg:text-sm font-medium text-center text-foreground">
          {label}
        </span>
      </button>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-2 p-3 lg:p-4 rounded-xl",
        "hover:bg-accent transition-colors group"
      )}
    >
      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-card border-2 border-[#2e8b57]/20 flex items-center justify-center group-hover:border-[#2e8b57]/40 transition-colors">
        <IconComponent />
      </div>
      <span className="text-xs lg:text-sm font-medium text-center text-foreground">
        {label}
      </span>
    </Link>
  )
}
