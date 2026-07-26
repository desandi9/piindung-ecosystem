"use client"

import { createCollectionClient } from "@/services/api/record-client"
import { DEFAULT_HELP_FAQ_CATEGORIES, type HelpFaqCategory, type HelpFaqIconKey, type HelpFaqItem } from "@/lib/faq-manager-data"

export type { HelpFaqCategory, HelpFaqIconKey, HelpFaqItem }
export { DEFAULT_HELP_FAQ_CATEGORIES }

export const HELP_FAQ_STORAGE_KEY = "piindung-help-faq"
export const HELP_FAQ_EVENT = "piindung-help-faq-updated"

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
