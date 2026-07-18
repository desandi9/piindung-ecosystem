"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { ArrowLeft, CircleHelp, CreditCard, Eye, FileText, FolderClosed, Layers, Megaphone, Pencil, Plus, RefreshCcw, Save, Shield, Settings, Trash2, Users, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { Card, CardContent } from "@/components/ui/card"
import { fadeUp, staggerContainer, staggerItem } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { DEFAULT_PUBLIC_PRODUCTS, type PublicProductId } from "@/lib/public-products-data"
import type { HelpContent, HelpCategory, HelpQuestion, HelpIconKey, HelpSupport } from "@/lib/help-content"

type IconOption = { label: string; value: HelpIconKey; icon: typeof CircleHelp }
const iconOptions: IconOption[] = [
  { label: "Bantuan / Umum", value: "help", icon: CircleHelp },
  { label: "Akun / Pengguna", value: "users", icon: Users },
  { label: "Sistem / Settings", value: "settings", icon: Settings },
  { label: "Keuangan / Transaksi", value: "credit-card", icon: CreditCard },
  { label: "Keamanan / Shield", value: "shield", icon: Shield },
]

function getIcon(key: string) {
  return iconOptions.find((opt) => opt.value === key)?.icon ?? CircleHelp
}

export default function MemberHelpContentPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const prefersReducedMotion = useReducedMotion()
  const [content, setContent] = useState<HelpContent | null>(null)
  const [original, setOriginal] = useState<HelpContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [query, setQuery] = useState("")
  const [preview, setPreview] = useState<HelpQuestion | null>(null)

  // Modals state
  const [categoryModal, setCategoryModal] = useState<{ mode: "add" | "edit"; category?: HelpCategory } | null>(null)
  const [questionModal, setQuestionModal] = useState<{ mode: "add" | "edit"; categoryId: string; question?: HelpQuestion } | null>(null)
  const [supportModal, setSupportModal] = useState<HelpSupport | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "question"; categoryId: string; questionId?: string; name: string } | null>(null)

  const ready = !isLoading && user?.role === "super_admin_pc"
  const reveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : fadeUp
  const itemReveal = prefersReducedMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerItem

  const loadContent = useCallback(async () => {
    setLoading(true); setError(""); setSuccess("")
    try {
      const response = await fetch("/api/help-content/manage", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal memuat pusat bantuan.")
      setContent(data.help)
      setOriginal(JSON.parse(JSON.stringify(data.help)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pusat bantuan.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/member-area/konten/bantuan")
    else if (!isLoading && user?.role !== "super_admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])

  useEffect(() => {
    if (ready) void loadContent()
  }, [loadContent, ready])

  const handleMigrate = async () => {
    if (migrating) return
    setMigrating(true); setError(""); setSuccess("")
    try {
      const response = await fetch("/api/help-content/migrate", { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal memigrasikan konten.")
      setContent(data.help)
      setOriginal(JSON.parse(JSON.stringify(data.help)))
      setSuccess("Konten berhasil dimigrasikan dari database lama.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memigrasikan konten.")
    } finally {
      setMigrating(false)
    }
  }

  const handleSave = async () => {
    if (!content || saving) return
    setSaving(true); setError(""); setSuccess("")
    try {
      const response = await fetch("/api/help-content/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan perubahan.")
      setContent(data.help)
      setOriginal(JSON.parse(JSON.stringify(data.help)))
      setSuccess("Perubahan berhasil disimpan ke database.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan.")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (original) {
      setContent(JSON.parse(JSON.stringify(original)))
      setError(""); setSuccess("Perubahan dibatalkan.")
    }
  }

  const hasChanges = useMemo(() => {
    return JSON.stringify(content) !== JSON.stringify(original)
  }, [content, original])

  // Mutation helpers
  const updateCategories = (next: HelpCategory[]) => {
    if (!content) return
    setContent({ ...content, categories: next })
  }

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    if (!content) return
    const next = [...content.categories]
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    const temp = next[index]
    next[index] = next[target]
    next[target] = temp
    next.forEach((category, i) => { category.position = i + 1 })
    updateCategories(next)
  }

  const handleMoveQuestion = (categoryId: string, index: number, direction: "up" | "down") => {
    if (!content) return
    const next = content.categories.map((category) => {
      if (category.id !== categoryId) return category
      const questions = [...category.questions]
      const target = direction === "up" ? index - 1 : index + 1
      if (target < 0 || target >= questions.length) return category
      const temp = questions[index]
      questions[index] = questions[target]
      questions[target] = temp
      questions.forEach((q, i) => { q.position = i + 1 })
      return { ...category, questions }
    })
    updateCategories(next)
  }

  const handleSaveCategory = (values: { id: string; title: string; iconKey: HelpIconKey; visible: boolean }) => {
    if (!content) return
    const categories = [...content.categories]
    if (categoryModal?.mode === "add") {
      if (categories.some((c) => c.id === values.id)) {
        setError("Kategori ID sudah digunakan.")
        return
      }
      categories.push({ ...values, position: categories.length + 1, questions: [] })
    } else if (categoryModal?.category) {
      const idx = categories.findIndex((c) => c.id === categoryModal.category!.id)
      if (idx !== -1) categories[idx] = { ...categories[idx], ...values }
    }
    updateCategories(categories)
    setCategoryModal(null)
  }

  const handleSaveQuestion = (values: { question: string; answer: string; productId?: PublicProductId; status: "draft" | "published" }) => {
    if (!content) return
    const categoryId = questionModal!.categoryId
    const next = content.categories.map((category) => {
      if (category.id !== categoryId) return category
      let questions = [...category.questions]
      if (questionModal?.mode === "add") {
        questions.push({
          id: `faq-${Date.now()}`,
          ...values,
          position: questions.length + 1,
        })
      } else if (questionModal?.question) {
        const idx = questions.findIndex((q) => q.id === questionModal.question!.id)
        if (idx !== -1) questions[idx] = { ...questions[idx], ...values }
      }
      return { ...category, questions }
    })
    updateCategories(next)
    setQuestionModal(null)
  }

  const handleDeleteConfirm = () => {
    if (!content || !deleteTarget) return
    const { type, categoryId, questionId } = deleteTarget
    if (type === "category") {
      const next = content.categories
        .filter((c) => c.id !== categoryId)
        .map((c, i) => ({ ...c, position: i + 1 }))
      updateCategories(next)
    } else if (questionId) {
      const next = content.categories.map((category) => {
        if (category.id !== categoryId) return category
        const questions = category.questions
          .filter((q) => q.id !== questionId)
          .map((q, i) => ({ ...q, position: i + 1 }))
        return { ...category, questions }
      })
      updateCategories(next)
    }
    setDeleteTarget(null)
  }

  // Filtered display categories
  const displayCategories = useMemo(() => {
    if (!content) return []
    const term = query.toLowerCase().trim()
    if (!term) return content.categories
    return content.categories.map((category) => {
      const questions = category.questions.filter(
        (q) => q.question.toLowerCase().includes(term) || q.answer.toLowerCase().includes(term)
      )
      return { ...category, questions }
    }).filter((category) => category.questions.length > 0 || category.title.toLowerCase().includes(term))
  }, [content, query])

  if (!ready) return <div className="min-h-screen bg-background" />

  return (
    <MemberLayout title="Pusat Bantuan" breadcrumb="Member Area / Konten / Bantuan">
      <div className="space-y-7 overflow-x-hidden pb-12">
        <motion.section variants={reveal} initial="hidden" animate="visible" className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <button onClick={() => router.push("/member-area/konten")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</button>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">Pusat Bantuan</p>
              <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Kelola Bantuan & FAQ</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">Atur kategori, urutan pertanyaan, asosiasi produk, dan tautan dukungan PIINDUNG dalam satu pusat pengelolaan bantuan.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleMigrate} disabled={migrating || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-accent disabled:opacity-60">
                <RefreshCcw className={cn("h-4 w-4", migrating && "animate-spin")} /> Migrasi Data Lama
              </button>
              <button onClick={() => setCategoryModal({ mode: "add" })} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-accent disabled:opacity-60">
                <Plus className="h-4 w-4" /> Tambah Kategori
              </button>
            </div>
          </div>
        </motion.section>

        {success && <div role="status" className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{success}</div>}
        {error && <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        {content && (
          <motion.div variants={prefersReducedMotion ? { hidden: {}, visible: {} } : staggerContainer} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-3">
            <motion.div variants={itemReveal} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Total Kategori</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{content.categories.length}</p>
            </motion.div>
            <motion.div variants={itemReveal} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">Total Pertanyaan</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{content.categories.reduce((acc, c) => acc + c.questions.length, 0)}</p>
            </motion.div>
            <motion.div variants={itemReveal} className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tautan Dukungan</p>
                <p className="mt-2 font-semibold text-foreground line-clamp-1">{content.support.buttonLabel} → {content.support.href}</p>
              </div>
              <button onClick={() => setSupportModal(content.support)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-accent"><Pencil className="h-4 w-4" /></button>
            </motion.div>
          </motion.div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-6">
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kategori, pertanyaan, atau jawaban..." className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-[#15945b]" />
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-card border border-border" />)}</div>
            ) : displayCategories.length === 0 ? (
              <Card className="border-border p-12 text-center text-sm text-muted-foreground">Tidak ada kategori atau FAQ yang sesuai pencarian.</Card>
            ) : (
              <div className="space-y-6">
                {displayCategories.map((category, catIdx) => {
                  const CategoryIcon = getIcon(category.iconKey)
                  return (
                    <article key={category.id} className={cn("rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300", !category.visible && "opacity-60")}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10"><CategoryIcon className="h-5 w-5" /></div>
                          <div>
                            <h3 className="font-bold text-foreground flex items-center gap-2">{category.title} {!category.visible && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Hidden</span>}</h3>
                            <p className="text-xs text-muted-foreground">ID: {category.id} · Posisi: {category.position}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => handleMoveCategory(catIdx, "up")} disabled={catIdx === 0} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-accent disabled:opacity-40">↑</button>
                          <button onClick={() => handleMoveCategory(catIdx, "down")} disabled={catIdx === displayCategories.length - 1} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-accent disabled:opacity-40">↓</button>
                          <button onClick={() => setCategoryModal({ mode: "edit", category })} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteTarget({ type: "category", categoryId: category.id, name: category.title })} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                          <button onClick={() => setQuestionModal({ mode: "add", categoryId: category.id })} className="inline-flex h-10 px-3 items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"><Plus className="h-3.5 w-3.5" /> FAQ</button>
                        </div>
                      </div>

                      <div className="mt-4 divide-y divide-border">
                        {category.questions.map((question, qIdx) => (
                          <div key={question.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1.5 max-w-2xl">
                              <h4 className="font-semibold text-foreground flex items-center gap-2">
                                {question.question}
                                {question.status === "draft" && <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">Draft</span>}
                                {question.productId && <span className="text-[9px] font-bold uppercase tracking-wider bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">{question.productId}</span>}
                              </h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-6">{question.answer}</p>
                            </div>
                            <div className="flex gap-1 justify-end shrink-0">
                              <button onClick={() => handleMoveQuestion(category.id, qIdx, "up")} disabled={qIdx === 0} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs hover:bg-accent disabled:opacity-40">↑</button>
                              <button onClick={() => handleMoveQuestion(category.id, qIdx, "down")} disabled={qIdx === category.questions.length - 1} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs hover:bg-accent disabled:opacity-40">↓</button>
                              <button onClick={() => setPreview(question)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent"><Eye className="h-4 w-4" /></button>
                              <button onClick={() => setQuestionModal({ mode: "edit", categoryId: category.id, question })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => setDeleteTarget({ type: "question", categoryId: category.id, questionId: question.id, name: question.question })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        ))}
                        {category.questions.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">Kategori ini belum memiliki FAQ.</div>}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="w-full lg:w-80 shrink-0">
            <Card className="border-border bg-card shadow-sm sticky top-24">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Pengendali Perubahan</h3>
                <p className="text-xs text-muted-foreground leading-5">Semua modifikasi (tambah, edit, reorder, delete) hanya disimpan di memori draft lokal hingga Anda mengonfirmasi simpan.</p>
                <div className="flex flex-col gap-2 pt-2">
                  <button onClick={handleSave} disabled={!hasChanges || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] text-white font-semibold transition hover:bg-[#107947] disabled:opacity-50">
                    <Save className="h-4 w-4" /> Simpan Perubahan
                  </button>
                  <button onClick={handleReset} disabled={!hasChanges || saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border font-semibold hover:bg-accent disabled:opacity-50">
                    Batalkan
                  </button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {categoryModal && (
          <CategoryFormDialog
            mode={categoryModal.mode}
            category={categoryModal.category}
            onClose={() => setCategoryModal(null)}
            onSave={handleSaveCategory}
            reduced={Boolean(prefersReducedMotion)}
          />
        )}

        {questionModal && (
          <QuestionFormDialog
            mode={questionModal.mode}
            question={questionModal.question}
            onClose={() => setQuestionModal(null)}
            onSave={handleSaveQuestion}
            reduced={Boolean(prefersReducedMotion)}
          />
        )}

        {supportModal && (
          <SupportFormDialog
            support={supportModal}
            onClose={() => setSupportModal(null)}
            onSave={(val) => {
              if (content) setContent({ ...content, support: val })
              setSupportModal(null)
            }}
            reduced={Boolean(prefersReducedMotion)}
          />
        )}

        {deleteTarget && (
          <ConfirmDeleteDialog
            target={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDeleteConfirm}
            reduced={Boolean(prefersReducedMotion)}
          />
        )}

        {preview && (
          <PreviewFaqDialog
            question={preview}
            onClose={() => setPreview(null)}
            reduced={Boolean(prefersReducedMotion)}
          />
        )}
      </AnimatePresence>
    </MemberLayout>
  )
}

function CategoryFormDialog({ mode, category, onClose, onSave, reduced }: { mode: "add" | "edit"; category?: HelpCategory; onClose: () => void; onSave: (val: any) => void; reduced: boolean }) {
  const [idVal, setId] = useState(category?.id ?? "")
  const [title, setTitle] = useState(category?.title ?? "")
  const [iconKey, setIconKey] = useState<HelpIconKey>(category?.iconKey ?? "help")
  const [visible, setVisible] = useState(category?.visible ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ id: idVal.trim().toLowerCase(), title: title.trim(), iconKey, visible })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <motion.div initial={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} className="w-full rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-lg sm:rounded-[24px] max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <h2 className="text-xl font-bold">{mode === "add" ? "Tambah Kategori" : "Edit Kategori"}</h2>
          <button onClick={onClose} className="h-11 w-11 border border-border rounded-xl flex items-center justify-center"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">KATEGORI ID (Hanya lowercase, angka, dan dash)</label>
            <input value={idVal} onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} disabled={mode === "edit"} placeholder="e.g. akun-akses" required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">JUDUL KATEGORI</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Akun dan Hak Akses" required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">IKON KATEGORI</label>
            <select value={iconKey} onChange={(e) => setIconKey(e.target.value as HelpIconKey)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]">
              {iconOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-3 py-2 cursor-pointer">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 rounded border-input text-[#15945b] focus:ring-[#15945b]" />
            <span className="text-sm font-semibold text-foreground">Tampilkan kategori ini ke publik</span>
          </label>
          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-5 font-semibold text-muted-foreground hover:bg-accent">Batal</button>
            <button type="submit" className="min-h-11 rounded-xl bg-primary text-primary-foreground px-5 font-semibold hover:bg-primary/90">Simpan</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function QuestionFormDialog({ mode, question, onClose, onSave, reduced }: { mode: "add" | "edit"; question?: HelpQuestion; onClose: () => void; onSave: (val: any) => void; reduced: boolean }) {
  const [q, setQ] = useState(question?.question ?? "")
  const [a, setA] = useState(question?.answer ?? "")
  const [productId, setProductId] = useState<string>(question?.productId ?? "")
  const [status, setStatus] = useState<"draft" | "published">(question?.status ?? "published")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ question: q.trim(), answer: a.trim(), productId: productId || undefined, status })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <motion.div initial={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} className="w-full rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-2xl sm:rounded-[24px] max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <h2 className="text-xl font-bold">{mode === "add" ? "Tambah FAQ" : "Edit FAQ"}</h2>
          <button onClick={onClose} className="h-11 w-11 border border-border rounded-xl flex items-center justify-center"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">PERTANYAAN</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Bagaimana cara menghubungi tim bantuan?" required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">JAWABAN</label>
            <textarea value={a} onChange={(e) => setA(e.target.value)} rows={5} placeholder="Jawaban detail..." required className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b] whitespace-pre-wrap" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">ASOSIASI PRODUK (Opsional)</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]">
                <option value="">Tidak ada</option>
                {DEFAULT_PUBLIC_PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">STATUS PUBLIKASI</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]">
                <option value="published">Published (Tampil)</option>
                <option value="draft">Draft (Disembunyikan)</option>
              </select>
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-5 font-semibold text-muted-foreground hover:bg-accent">Batal</button>
            <button type="submit" className="min-h-11 rounded-xl bg-primary text-primary-foreground px-5 font-semibold hover:bg-primary/90">Simpan</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function SupportFormDialog({ support, onClose, onSave, reduced }: { support: HelpSupport; onClose: () => void; onSave: (val: HelpSupport) => void; reduced: boolean }) {
  const [title, setTitle] = useState(support.title)
  const [desc, setDesc] = useState(support.description)
  const [label, setLabel] = useState(support.buttonLabel)
  const [href, setHref] = useState(support.href)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ title: title.trim(), description: desc.trim(), buttonLabel: label.trim(), href: href.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <motion.div initial={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} className="w-full rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-lg sm:rounded-[24px] max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <h2 className="text-xl font-bold">Edit Tautan Dukungan</h2>
          <button onClick={onClose} className="h-11 w-11 border border-border rounded-xl flex items-center justify-center"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">JUDUL DUKUNGAN</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">DESKRIPSI DUKUNGAN</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} required className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">LABEL TOMBOL</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">TAUTAN URL</label>
              <input value={href} onChange={(e) => setHref(e.target.value)} required className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" />
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border px-5 font-semibold text-muted-foreground hover:bg-accent">Batal</button>
            <button type="submit" className="min-h-11 rounded-xl bg-primary text-primary-foreground px-5 font-semibold hover:bg-primary/90">Simpan</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function ConfirmDeleteDialog({ target, onClose, onConfirm, reduced }: { target: { type: "category" | "question"; name: string }; onClose: () => void; onConfirm: () => void; reduced: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <motion.div initial={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} className="w-full rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-md sm:rounded-[24px]">
        <h3 className="text-xl font-bold text-destructive">Konfirmasi Hapus</h3>
        <p className="mt-3 text-sm text-muted-foreground leading-6">Apakah Anda yakin ingin menghapus {target.type === "category" ? "kategori beserta seluruh FAQ di dalamnya" : "FAQ ini"}?</p>
        <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive font-semibold break-words">"{target.name}"</div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="min-h-11 rounded-xl border border-border px-5 font-semibold text-muted-foreground hover:bg-accent">Batal</button>
          <button onClick={onConfirm} className="min-h-11 rounded-xl bg-destructive text-destructive-foreground px-5 font-semibold hover:bg-destructive/90">Ya, Hapus</button>
        </div>
      </motion.div>
    </div>
  )
}

function PreviewFaqDialog({ question, onClose, reduced }: { question: HelpQuestion; onClose: () => void; reduced: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <motion.div initial={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduced ? { opacity: 1 } : { y: 24, opacity: 0 }} className="w-full rounded-t-[24px] bg-card p-6 shadow-xl sm:max-w-xl sm:rounded-[24px] max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Preview FAQ</h3>
          <button onClick={onClose} className="h-11 w-11 border border-border rounded-xl flex items-center justify-center"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pertanyaan</p>
            <p className="mt-2 text-sm font-bold text-foreground">{question.question}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Jawaban</p>
            <p className="mt-2 text-sm leading-6 text-foreground whitespace-pre-wrap">{question.answer}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <span>Status: <strong className="capitalize">{question.status}</strong></span>
            {question.productId && <span>Produk: <strong>{question.productId}</strong></span>}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
