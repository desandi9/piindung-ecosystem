"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, BookOpen, ChevronDown, LayoutGrid, LogIn, MessageCircle, Rocket } from "lucide-react"
import { useEffect, useState } from "react"
import { LandingReveal, perCardReveal } from "@/components/piindung/landing-motion"
import { whatsappHref, type SiteContactContent } from "@/lib/site-contact"
import { usePortalEntry } from "./home-navbar"

const steps = [
  {
    icon: LogIn,
    title: "Masuk",
    text: "Buka halaman masuk, lalu gunakan nomor HP dan kata sandi akun PIINDUNG Anda.",
  },
  {
    icon: LayoutGrid,
    title: "Pilih aplikasi",
    text: "Dasbor menampilkan aplikasi yang tersedia untuk peran dan wilayah tugas Anda.",
  },
  {
    icon: Rocket,
    title: "Mulai bekerja",
    text: "Buka aplikasi pilihan dan lanjutkan tugas dengan sesi yang sama, tanpa masuk ulang.",
  },
]

const faqs = [
  {
    question: "Siapa yang bisa masuk ke PIINDUNG?",
    answer: "Pengurus dan petugas NU Care–LAZISNU Garut yang sudah memiliki akun, seperti PC, UPZIS, Kordes, PLPK, dan Munfiq.",
  },
  {
    question: "Saya belum punya akun. Bagaimana caranya?",
    answer: "Akun PIINDUNG dibuatkan oleh pengelola. Hubungi admin LAZISNU Garut melalui kontak di halaman ini untuk mendapatkan akses.",
  },
  {
    question: "Bagaimana jika saya lupa kata sandi?",
    answer: "Hubungi admin LAZISNU Garut untuk mengatur ulang kata sandi. Jangan bagikan kata sandi Anda kepada siapa pun.",
  },
  {
    question: "Kenapa ada aplikasi yang belum bisa dibuka?",
    answer: "Aplikasi berstatus Segera hadir masih disiapkan. Setelah aktif, aplikasi tersebut bisa dibuka dengan akun yang sama.",
  },
]

export function HomeSteps() {
  const reduced = useReducedMotion()
  const reveal = perCardReveal(!!reduced, 3)
  const entry = usePortalEntry()

  return (
    <section id="cara-kerja" aria-labelledby="home-steps-heading" className="scroll-mt-20 bg-[#f3f7f5] py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)] lg:items-end lg:gap-12">
          <LandingReveal distance={24}>
            <h2 id="home-steps-heading" className="max-w-[14ch] text-[clamp(2.1rem,4.4vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#08213b]">
              Mulai dalam tiga langkah.
            </h2>
          </LandingReveal>
          <LandingReveal distance={24} delay={0.1}>
            <p className="max-w-[31rem] text-[16px] leading-[1.75] text-[#5b6878] lg:justify-self-end">
              Tidak perlu mengingat banyak akun. Setelah masuk, PIINDUNG menunjukkan aplikasi yang memang menjadi bagian tugas Anda.
            </p>
          </LandingReveal>
        </div>

        <ol className="relative mt-14 grid gap-10 sm:mt-16 md:grid-cols-3 md:gap-8">
          <span aria-hidden="true" className="absolute left-8 right-[calc((100%_-_64px)/3_-_32px)] top-[32px] hidden h-px border-t border-dashed border-[#08213b]/20 md:block" />
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.li
                key={step.title}
                custom={index}
                variants={reveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                className="relative grid grid-cols-[64px_minmax(0,1fr)] gap-5 md:block"
              >
                {index < steps.length - 1 && <span aria-hidden="true" className="absolute -bottom-10 left-8 top-16 border-l border-dashed border-[#08213b]/20 md:hidden" />}
                <span className="relative grid h-16 w-16 place-items-center rounded-full bg-[#08213b] text-[#c9f26d] shadow-[0_16px_30px_-14px_rgba(8,33,59,.6)] ring-8 ring-[#f3f7f5]">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#c9f26d] text-[12px] font-extrabold text-[#061423]">{index + 1}</span>
                </span>
                <div className="md:mt-7 md:pr-6">
                  <h3 className="text-[21px] font-bold tracking-[-0.03em] text-[#08213b]">{step.title}</h3>
                  <p className="mt-2 max-w-[34ch] text-[15px] leading-[1.7] text-[#5b6878]">{step.text}</p>
                </div>
              </motion.li>
            )
          })}
        </ol>

        <LandingReveal distance={20} className="mt-14 flex flex-col gap-4 rounded-[28px] bg-white p-6 ring-1 ring-[#dce8e2] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <p className="text-[15px] leading-relaxed text-[#5b6878]">
            <strong className="font-bold text-[#08213b]">Sudah punya akun?</strong> Langsung masuk dan pilih aplikasi Anda.
          </p>
          <Link
            href={entry.href}
            className="group inline-flex h-[52px] shrink-0 items-center justify-between gap-4 rounded-full bg-[#08213b] pl-6 pr-1.5 text-[15px] font-bold text-white transition hover:bg-[#0c2c4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4"
          >
            {entry.label}
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#c9f26d] text-[#061423] transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
          </Link>
        </LandingReveal>
      </div>
    </section>
  )
}

export function useSiteContact() {
  const [contact, setContact] = useState<SiteContactContent | null>(null)
  useEffect(() => {
    fetch("/api/site-contact")
      .then((res) => res.json())
      .then((data) => data.contact && setContact(data.contact))
      .catch(() => undefined)
  }, [])
  return contact
}

export function HomeHelp({ contact }: { contact: SiteContactContent | null }) {
  const reachHref = contact?.contact.whatsappNumber ? whatsappHref(contact.contact.whatsappNumber, contact.contact.whatsappMessage) : "/kontak"
  const external = reachHref.startsWith("http")

  return (
    <section id="bantuan" aria-labelledby="home-help-heading" className="scroll-mt-20 bg-white py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <LandingReveal distance={24}>
          <h2 id="home-help-heading" className="text-[clamp(2.1rem,4.4vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#08213b]">Butuh bantuan?</h2>
          <p className="mt-5 max-w-[30rem] text-[16px] leading-[1.75] text-[#5b6878]">
            Jawaban singkat untuk pertanyaan yang paling sering muncul. Panduan lengkap setiap aplikasi tersedia di Pusat Bantuan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/bantuan"
              className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-[#08213b] px-6 text-[15px] font-bold text-white transition hover:bg-[#0c2c4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] focus-visible:ring-offset-4"
            >
              <BookOpen className="h-[18px] w-[18px]" aria-hidden="true" />
              Buka Pusat Bantuan
            </Link>
            <a
              href={reachHref}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full border border-[#cfdcd6] px-6 text-[15px] font-semibold text-[#08213b] transition hover:border-[#07965d] hover:text-[#06784b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]"
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
              Hubungi admin
            </a>
          </div>
        </LandingReveal>

        <LandingReveal distance={24} delay={0.08}>
          <div className="home-faq divide-y divide-[#dce8e2] border-y border-[#dce8e2]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xl py-5 text-[17px] font-bold tracking-[-0.02em] text-[#08213b] transition-colors hover:text-[#06784b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]">
                  {faq.question}
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f3f7f5] text-[#08213b] transition-transform duration-300 group-open:rotate-180 group-open:bg-[#c9f26d]">
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </span>
                </summary>
                <p className="max-w-[60ch] pb-6 pr-12 text-[15px] leading-[1.75] text-[#5b6878]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </LandingReveal>
      </div>
    </section>
  )
}
