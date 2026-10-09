"use client"

import Link from "next/link"
import { motion, useReducedMotion, type Variants } from "motion/react"
import {
  ArrowLeft,
  Fingerprint,
  Headset,
  ImageUp,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { motionEase } from "@/lib/motion"

// Satu nomor WhatsApp melayani Admin operasional sekaligus Tim IT.
const SUPPORT_WHATSAPP = "081315845704"

function whatsappHref(message: string) {
  const digits = SUPPORT_WHATSAPP.replace(/\D/g, "")
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

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

const troubleshooting: Array<{ icon: React.ElementType; title: string; steps: string[] }> = [
  {
    icon: LockKeyhole,
    title: "Tidak bisa login",
    steps: [
      "Pastikan nomor HP diketik tanpa spasi dan diawali 08.",
      "Cek tombol lihat password untuk memastikan tidak ada salah ketik.",
      "Jika lupa password, hubungi Admin lewat tombol WhatsApp di atas untuk reset manual.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Akses modul ditolak",
    steps: [
      "Menu atau modul tertentu hanya terbuka sesuai hak akses peran Anda.",
      "Jika seharusnya punya akses tetapi ditolak, minta Admin memeriksa Hak Akses akun Anda.",
      "Sebutkan nama modul yang ingin dibuka saat menghubungi Admin agar cepat ditangani.",
    ],
  },
  {
    icon: ImageUp,
    title: "Upload foto atau dokumen gagal",
    steps: [
      "Gunakan format JPG atau PNG dengan ukuran maksimal 10MB.",
      "Jika unggahan berhenti, periksa koneksi lalu ulangi dari awal.",
      "Untuk foto profil, sesuaikan posisi dan ukuran pada jendela pemotongan sebelum menyimpan.",
    ],
  },
  {
    icon: RefreshCw,
    title: "Data tidak muncul atau tidak terbarui",
    steps: [
      "Muat ulang halaman dengan Cmd/Ctrl + Shift + R untuk mengambil data terbaru.",
      "Pastikan sesi masih aktif; jika diarahkan ke halaman login, masuk kembali.",
      "Bila data tetap kosong setelah dimuat ulang, laporkan ke Tim IT dengan menyebut halamannya.",
    ],
  },
  {
    icon: KeyRound,
    title: "Mengubah password",
    steps: [
      "Buka Pengaturan Profil, lalu isi bagian Keamanan Akun.",
      "Password baru minimal 8 karakter dan berbeda dari password lama.",
      "Setelah diubah, sesi ini berakhir dan Anda perlu login kembali.",
    ],
  },
  {
    icon: Fingerprint,
    title: "Identitas & data anggota",
    steps: [
      "Nomor keanggotaan dan kartu identitas digital tersedia di menu Identitas.",
      "Perbarui nama, email, nomor HP, dan alamat lewat Pengaturan Profil.",
      "Perubahan data sensitif lain di luar profil dilakukan oleh Admin.",
    ],
  },
]

export default function DashboardBantuanPage() {
  const headerReveal = useReveal()
  const contactReveal = useReveal(0.05)
  const guideReveal = useReveal(0.1)

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f9f6] dark:bg-[#07131f]">
      <Navbar />
      <main className="container mx-auto max-w-4xl flex-1 space-y-8 px-4 py-8 sm:py-10">
        <motion.header initial="hidden" animate="visible" variants={headerReveal}>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#07965d] transition-colors hover:text-[#067a4c] dark:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#08213b] dark:text-white sm:text-4xl">
            Pusat Bantuan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6c7a89] dark:text-slate-300 sm:text-[15px]">
            Panduan teknis penggunaan dashboard dan jalur bantuan langsung ke Admin serta Tim IT bila ada kendala.
          </p>
        </motion.header>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={contactReveal}
          aria-labelledby="bantuan-kontak-heading"
          className="overflow-hidden rounded-[28px] border border-[#dce8e2]/90 bg-white/90 p-6 shadow-[0_14px_36px_rgba(9,43,32,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1e2d]/85 sm:p-7"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-500/15 dark:text-emerald-300">
              <Headset className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="bantuan-kontak-heading"
                className="text-lg font-bold tracking-tight text-[#08213b] dark:text-white sm:text-xl"
              >
                Butuh bantuan langsung?
              </h2>
              <p className="mt-0.5 text-sm leading-6 text-[#6c7a89] dark:text-slate-400">
                Hubungi lewat WhatsApp. Sebutkan nama, peran, dan detail kendala agar cepat ditindaklanjuti.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href={whatsappHref("Assalamualaikum Admin, saya butuh bantuan operasional dashboard. Nama saya ")}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-[#dce8e2]/80 bg-[#f8fbf9]/70 p-4 transition hover:border-[#07965d]/40 hover:bg-[#e7f7ef]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:hover:bg-emerald-500/10 dark:focus-visible:ring-offset-[#07131f]"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#07965d] to-[#0bbf78] text-white shadow-md">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-[#08213b] dark:text-white">WhatsApp Admin</span>
                <span className="block text-sm text-[#6c7a89] dark:text-slate-400">
                  Bantuan operasional, akses, dan data
                </span>
              </span>
            </a>

            <a
              href={whatsappHref("Assalamualaikum Tim IT, saya menemukan kendala teknis pada dashboard. Nama saya ")}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-[#dce8e2]/80 bg-[#f8fbf9]/70 p-4 transition hover:border-[#07965d]/40 hover:bg-[#e7f7ef]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:hover:bg-emerald-500/10 dark:focus-visible:ring-offset-[#07131f]"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#08213b] to-[#07965d] text-white shadow-md">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-[#08213b] dark:text-white">WhatsApp Tim IT</span>
                <span className="block text-sm text-[#6c7a89] dark:text-slate-400">
                  Error sistem, bug, dan gangguan teknis
                </span>
              </span>
            </a>
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          animate="visible"
          variants={guideReveal}
          aria-labelledby="bantuan-panduan-heading"
          className="rounded-[28px] border border-[#dce8e2]/90 bg-white/90 p-6 shadow-[0_14px_36px_rgba(9,43,32,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1e2d]/85 sm:p-7"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e7f7ef] text-[#07965d] dark:bg-emerald-500/15 dark:text-emerald-300">
              <LifeBuoy className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="bantuan-panduan-heading"
                className="text-lg font-bold tracking-tight text-[#08213b] dark:text-white sm:text-xl"
              >
                Panduan teknis singkat
              </h2>
              <p className="mt-0.5 text-sm leading-6 text-[#6c7a89] dark:text-slate-400">
                Langkah cepat untuk kendala yang paling sering ditemui sebelum menghubungi bantuan.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {troubleshooting.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#dce8e2]/70 bg-[#f8fbf9]/60 p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#07965d] shadow-sm dark:bg-white/10 dark:text-emerald-300">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h3 className="font-semibold text-[#08213b] dark:text-white">{item.title}</h3>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {item.steps.map((step) => (
                      <li
                        key={step}
                        className="flex gap-2 text-sm leading-6 text-[#6c7a89] dark:text-slate-400"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#07965d]/60 dark:bg-emerald-400/60"
                        />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </motion.section>
      </main>
      <SimpleFooter />
    </div>
  )
}
