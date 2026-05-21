"use client"

import { createCollectionClient } from "@/services/api/record-client"

export type HelpFaqIconKey = "users" | "credit-card" | "shield" | "settings"

export interface HelpFaqItem {
  id: string
  q: string
  a: string
}

export interface HelpFaqCategory {
  id: string
  title: string
  iconKey: HelpFaqIconKey
  questions: HelpFaqItem[]
}

export const HELP_FAQ_STORAGE_KEY = "piindung-help-faq"
export const HELP_FAQ_EVENT = "piindung-help-faq-updated"

export const DEFAULT_HELP_FAQ_CATEGORIES: HelpFaqCategory[] = [
  {
    id: "akun",
    title: "Akun & Login",
    iconKey: "users",
    questions: [
      {
        id: "akun-1",
        q: "Bagaimana cara reset password?",
        a: "Klik tombol 'Lupa Password' di halaman login, masukkan email terdaftar, kemudian ikuti instruksi yang dikirim ke email Anda.",
      },
      {
        id: "akun-2",
        q: "Bagaimana cara mengubah email akun?",
        a: "Buka menu Pengaturan Profil, pilih 'Ubah Email', masukkan email baru dan verifikasi melalui kode OTP.",
      },
      {
        id: "akun-3",
        q: "Mengapa akun saya terkunci?",
        a: "Akun dapat terkunci karena percobaan login gagal berulang kali. Hubungi admin untuk membuka kunci akun Anda.",
      },
    ],
  },
  {
    id: "gorut",
    title: "GORUT (Gerakan KOIN NU Garut)",
    iconKey: "credit-card",
    questions: [
      {
        id: "gorut-1",
        q: "Apa itu GORUT?",
        a: "GORUT adalah Gerakan KOIN NU Garut, program penghimpunan dan pengelolaan koin infaq secara rutin untuk mendukung gerakan sosial dan pemberdayaan umat.",
      },
      {
        id: "gorut-2",
        q: "Bagaimana cara mendaftar sebagai Munfiq?",
        a: "Hubungi koordinator desa atau UPZIS setempat untuk mendaftarkan diri sebagai peserta GORUT.",
      },
      {
        id: "gorut-3",
        q: "Bagaimana cara melihat riwayat setoran?",
        a: "Masuk ke aplikasi GORUT, pilih menu 'Riwayat' untuk melihat semua transaksi setoran Anda.",
      },
    ],
  },
  {
    id: "keamanan",
    title: "Keamanan",
    iconKey: "shield",
    questions: [
      {
        id: "keamanan-1",
        q: "Bagaimana cara mengaktifkan keamanan ganda?",
        a: "Buka Pengaturan Profil > Keamanan > Aktifkan Verifikasi 2 Langkah, kemudian ikuti petunjuk yang diberikan.",
      },
      {
        id: "keamanan-2",
        q: "Apakah data saya aman?",
        a: "Ya, kami menggunakan enkripsi SSL dan standar keamanan terbaik untuk melindungi semua data pengguna.",
      },
    ],
  },
  {
    id: "teknis",
    title: "Masalah Teknis",
    iconKey: "settings",
    questions: [
      {
        id: "teknis-1",
        q: "Aplikasi tidak bisa dibuka, apa yang harus dilakukan?",
        a: "Coba refresh halaman, hapus cache browser, atau gunakan browser lain. Jika masih bermasalah, hubungi tim support.",
      },
      {
        id: "teknis-2",
        q: "Notifikasi tidak muncul, bagaimana mengatasinya?",
        a: "Pastikan notifikasi browser diizinkan untuk website ini. Periksa pengaturan browser Anda.",
      },
    ],
  },
]

const faqClient = createCollectionClient<HelpFaqCategory>({
  scope: "faq-manager",
  defaultItems: DEFAULT_HELP_FAQ_CATEGORIES,
  eventName: HELP_FAQ_EVENT,
})

function dispatchFaqEvent(categories: HelpFaqCategory[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<HelpFaqCategory[]>(HELP_FAQ_EVENT, { detail: categories }))
}

export function readHelpFaqCategories() {
  try {
    const parsedFaq = faqClient.readItemsSync()
    const storedById = new Map(parsedFaq.map((category) => [category.id, category]))
    const mergedDefaults = DEFAULT_HELP_FAQ_CATEGORIES.map((category) => {
      const storedCategory = storedById.get(category.id)

      if (category.id === "gorut" && storedCategory) {
        return {
          ...storedCategory,
          title: "GORUT (Gerakan KOIN NU Garut)",
          questions: storedCategory.questions.map((question) => {
            if (question.id !== "gorut-1") return question

            return {
              ...question,
              a: "GORUT adalah Gerakan KOIN NU Garut, program penghimpunan dan pengelolaan koin infaq secara rutin untuk mendukung gerakan sosial dan pemberdayaan umat.",
            }
          }),
        }
      }

      return storedCategory ?? category
    })
    const extraStored = parsedFaq.filter((category) => !DEFAULT_HELP_FAQ_CATEGORIES.some((defaultCategory) => defaultCategory.id === category.id))

    return [...mergedDefaults, ...extraStored]
  } catch {
    return DEFAULT_HELP_FAQ_CATEGORIES
  }
}

export function writeHelpFaqCategories(categories: HelpFaqCategory[]) {
  void faqClient.writeItems(categories)
}

export function updateHelpFaqCategory(categoryId: string, updates: Partial<Omit<HelpFaqCategory, "id">>) {
  const categories = readHelpFaqCategories().map((category) => {
    if (category.id !== categoryId) return category
    return { ...category, ...updates }
  })

  writeHelpFaqCategories(categories)
  return categories
}

export function addHelpFaqQuestion(categoryId: string, question: Omit<HelpFaqItem, "id">) {
  return updateHelpFaqCategory(categoryId, {
    questions: [
      ...((readHelpFaqCategories().find((category) => category.id === categoryId)?.questions ?? [])),
      { id: `faq-${Date.now()}`, ...question },
    ],
  })
}

export function updateHelpFaqQuestion(categoryId: string, questionId: string, updates: Partial<Omit<HelpFaqItem, "id">>) {
  const category = readHelpFaqCategories().find((item) => item.id === categoryId)
  if (!category) return readHelpFaqCategories()

  return updateHelpFaqCategory(categoryId, {
    questions: category.questions.map((question) => {
      if (question.id !== questionId) return question
      return { ...question, ...updates }
    }),
  })
}

export function deleteHelpFaqQuestion(categoryId: string, questionId: string) {
  const category = readHelpFaqCategories().find((item) => item.id === categoryId)
  if (!category) return readHelpFaqCategories()

  return updateHelpFaqCategory(categoryId, {
    questions: category.questions.filter((question) => question.id !== questionId),
  })
}

export function useHelpFaqCategories() {
  return faqClient.useItems()
}
