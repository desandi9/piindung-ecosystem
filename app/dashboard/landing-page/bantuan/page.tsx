"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  CircleHelp,
  CreditCard,
  ExternalLink,
  Pencil,
  Plus,
  Save,
  Settings,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/landing-page/member-shell"
import { cn } from "@/lib/utils"
import { DEFAULT_PUBLIC_PRODUCTS, type PublicProductId } from "@/lib/public-products-data"
import type { HelpCategory, HelpContent, HelpIconKey, HelpQuestion, HelpQuestionStatus, HelpSupport } from "@/lib/help-content"

type Section = "display" | "categories" | "questions" | "support"
type Editor =
  | { type: "category"; mode: "add" | "edit"; category?: HelpCategory }
  | { type: "question"; mode: "add" | "edit"; categoryId: string; question?: HelpQuestion }
  | { type: "support" }
  | null

type DeleteTarget = {
  type: "category" | "question"
  categoryId: string
  questionId?: string
  name: string
}

const iconOptions: Array<{ label: string; value: HelpIconKey; icon: typeof CircleHelp }> = [
  { label: "Bantuan", value: "help", icon: CircleHelp },
  { label: "Pengguna", value: "users", icon: Users },
  { label: "Pengaturan", value: "settings", icon: Settings },
  { label: "Transaksi", value: "credit-card", icon: CreditCard },
  { label: "Keamanan", value: "shield", icon: Shield },
]

function getIcon(key: HelpIconKey) {
  return iconOptions.find((option) => option.value === key)?.icon ?? CircleHelp
}

function cloneContent(content: HelpContent) {
  return JSON.parse(JSON.stringify(content)) as HelpContent
}

export default function HelpContentPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [content, setContent] = useState<HelpContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [openSection, setOpenSection] = useState<Section>("display")
  const [editor, setEditor] = useState<Editor>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const ready = !isLoading && user?.role === "super_admin_pc"

  const loadContent = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/help-content/manage", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal memuat pusat bantuan.")
      setContent(data.help)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal memuat pusat bantuan.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/dashboard/landing-page/bantuan")
    else if (!isLoading && user?.role !== "super_admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])

  useEffect(() => {
    if (ready) void loadContent()
  }, [loadContent, ready])

  const persist = async (next: HelpContent, message: string) => {
    if (saving) return false
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const response = await fetch("/api/help-content/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan perubahan.")
      setContent(data.help)
      setSuccess(message)
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menyimpan perubahan.")
      return false
    } finally {
      setSaving(false)
    }
  }

  const moveCategory = async (categoryId: string, direction: "up" | "down") => {
    if (!content) return
    const next = cloneContent(content)
    const index = next.categories.findIndex((category) => category.id === categoryId)
    const target = direction === "up" ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= next.categories.length) return
    ;[next.categories[index], next.categories[target]] = [next.categories[target], next.categories[index]]
    next.categories.forEach((category, position) => { category.position = position + 1 })
    await persist(next, "Urutan kategori berhasil disimpan.")
  }

  const moveQuestion = async (categoryId: string, questionId: string, direction: "up" | "down") => {
    if (!content) return
    const next = cloneContent(content)
    const category = next.categories.find((item) => item.id === categoryId)
    if (!category) return
    const index = category.questions.findIndex((question) => question.id === questionId)
    const target = direction === "up" ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= category.questions.length) return
    ;[category.questions[index], category.questions[target]] = [category.questions[target], category.questions[index]]
    category.questions.forEach((question, position) => { question.position = position + 1 })
    await persist(next, "Urutan pertanyaan berhasil disimpan.")
  }

  const saveCategory = async (values: { id: string; title: string; iconKey: HelpIconKey; visible: boolean }) => {
    if (!content || editor?.type !== "category") return
    const next = cloneContent(content)
    if (editor.mode === "add") {
      if (next.categories.some((category) => category.id === values.id)) {
        setError("ID kategori sudah digunakan.")
        return
      }
      next.categories.push({ ...values, position: next.categories.length + 1, questions: [] })
    } else if (editor.category) {
      const index = next.categories.findIndex((category) => category.id === editor.category?.id)
      if (index >= 0) next.categories[index] = { ...next.categories[index], ...values }
    }
    if (await persist(next, "Kategori berhasil disimpan.")) setEditor(null)
  }

  const saveQuestion = async (values: { question: string; answer: string; productId?: PublicProductId; status: HelpQuestionStatus; categoryId: string }) => {
    if (!content || editor?.type !== "question") return
    const next = cloneContent(content)
    const source = next.categories.find((category) => category.id === editor.categoryId)
    const target = next.categories.find((category) => category.id === values.categoryId)
    if (!source || !target) return

    if (editor.mode === "add") {
      target.questions.push({
        id: `faq-${Date.now()}`,
        question: values.question,
        answer: values.answer,
        productId: values.productId,
        status: values.status,
        position: target.questions.length + 1,
      })
    } else if (editor.question) {
      source.questions = source.questions.filter((question) => question.id !== editor.question?.id)
      source.questions.forEach((question, position) => { question.position = position + 1 })
      target.questions.push({
        ...editor.question,
        question: values.question,
        answer: values.answer,
        productId: values.productId,
        status: values.status,
        position: target.questions.length + 1,
      })
    }
    if (await persist(next, "Pertanyaan berhasil disimpan.")) setEditor(null)
  }

  const saveSupport = async (support: HelpSupport) => {
    if (!content) return
    const next = { ...cloneContent(content), support }
    if (await persist(next, "Kontak bantuan berhasil disimpan.")) setEditor(null)
  }

  const confirmDelete = async () => {
    if (!content || !deleteTarget) return
    const next = cloneContent(content)
    if (deleteTarget.type === "category") {
      next.categories = next.categories.filter((category) => category.id !== deleteTarget.categoryId)
      next.categories.forEach((category, position) => { category.position = position + 1 })
    } else {
      const category = next.categories.find((item) => item.id === deleteTarget.categoryId)
      if (category) {
        category.questions = category.questions.filter((question) => question.id !== deleteTarget.questionId)
        category.questions.forEach((question, position) => { question.position = position + 1 })
      }
    }
    if (await persist(next, `${deleteTarget.type === "category" ? "Kategori" : "Pertanyaan"} berhasil dihapus.`)) {
      setDeleteTarget(null)
      setEditor(null)
    }
  }

  const allQuestions = useMemo(() => content?.categories.flatMap((category) => category.questions.map((question) => ({ category, question }))) ?? [], [content])

  const toggleSection = (section: Section) => {
    setOpenSection((current) => current === section ? "display" : section)
    setEditor(null)
  }

  if (!ready) return <div className="min-h-screen bg-background" />

  const visibleCategoriesCount = content ? content.categories.filter((c) => c.visible).length : 0
  const publishedQuestionsCount = allQuestions.filter(({ question }) => question.status === "published").length
  const supportStatus = content && content.support.title.trim() && content.support.href.trim() ? "Aktif" : "Belum lengkap"

  return (
    <MemberLayout title="Kelola Pusat Bantuan" breadcrumb="Kelola Landing Page / Pusat Bantuan">
      <div className="space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <Link href="/dashboard/landing-page" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#6c7a89] transition hover:bg-[#e6f7ee] hover:text-[#07965d] dark:text-slate-400 dark:hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Kelola Landing Page
          </Link>
          <a href="/bantuan" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#dce8e2] px-4 text-sm font-semibold text-[#08213b] transition hover:bg-[#e7f7ef] dark:border-white/10 dark:text-white dark:hover:bg-white/10">
            <ExternalLink className="h-4 w-4" /> Preview Pusat Bantuan
          </a>
        </div>

        {success && <div role="status" className="rounded-xl border border-[#15945b]/20 bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400">{success}</div>}
        {error && <div role="alert" className="flex flex-col gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => void loadContent()} className="font-semibold underline">Muat ulang</button></div>}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />)}</div>
        ) : content ? (
          <div className="space-y-3">
            <AccordionCard title="Tampilan Halaman" description="Ringkasan konten yang tampil pada halaman bantuan publik." status="Ringkasan" open={openSection === "display"} onToggle={() => toggleSection("display")}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Summary label="Kategori terlihat" value={content.categories.filter((category) => category.visible).length} />
                <Summary label="Pertanyaan terbit" value={allQuestions.filter(({ question }) => question.status === "published").length} />
                <Summary label="Kontak bantuan" value={content.support.buttonLabel} />
              </div>
            </AccordionCard>

            <AccordionCard title="Kategori Bantuan" description="Atur nama, ikon, posisi, and visibilitas kategori." status={`${visibleCategoriesCount} Terlihat`} open={openSection === "categories"} onToggle={() => toggleSection("categories")}>
              <div className="mb-4 flex justify-end">
                <button type="button" onClick={() => setEditor({ type: "category", mode: "add" })} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#15945b] px-4 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" /> Tambah Kategori</button>
              </div>
              {editor?.type === "category" && editor.mode === "add" && <CategoryEditor onSave={saveCategory} onCancel={() => setEditor(null)} saving={saving} />}
              <div className="space-y-3">
                {content.categories.map((category, index) => {
                  const Icon = getIcon(category.iconKey)
                  const editing = editor?.type === "category" && editor.mode === "edit" && editor.category?.id === category.id
                  return (
                    <div key={category.id} className={cn("rounded-2xl border border-border p-4", !category.visible && "opacity-60")}>
                      {editing ? <CategoryEditor category={category} onSave={saveCategory} onCancel={() => setEditor(null)} saving={saving} /> : (
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10"><Icon className="h-5 w-5" /></span>
                            <div className="min-w-0"><p className="font-semibold">{category.title}</p><p className="text-xs text-muted-foreground">Posisi {category.position} · {category.visible ? "Ditampilkan" : "Disembunyikan"}</p></div>
                          </div>
                          <ItemActions first={index === 0} last={index === content.categories.length - 1} saving={saving} onUp={() => void moveCategory(category.id, "up")} onDown={() => void moveCategory(category.id, "down")} onEdit={() => setEditor({ type: "category", mode: "edit", category })} onDelete={() => setDeleteTarget({ type: "category", categoryId: category.id, name: category.title })} />
                        </div>
                      )}
                    </div>
                  )
                })}
                {content.categories.length === 0 && <EmptyState text="Belum ada kategori bantuan." />}
              </div>
            </AccordionCard>

            <AccordionCard title="Pertanyaan Umum" description="Kelola pertanyaan, jawaban, kategori, urutan, dan status publikasi." status={`${publishedQuestionsCount} Terbit`} open={openSection === "questions"} onToggle={() => toggleSection("questions")}>
              <div className="mb-4 flex justify-end">
                <button type="button" onClick={() => content.categories[0] && setEditor({ type: "question", mode: "add", categoryId: content.categories[0].id })} disabled={saving || content.categories.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#15945b] px-4 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" /> Tambah Pertanyaan</button>
              </div>
              {editor?.type === "question" && editor.mode === "add" && <QuestionEditor categories={content.categories} categoryId={editor.categoryId} onSave={saveQuestion} onCancel={() => setEditor(null)} saving={saving} />}
              <div className="space-y-5">
                {content.categories.map((category) => (
                  <div key={category.id}>
                    <h3 className="mb-2 text-sm font-bold text-muted-foreground">{category.title}</h3>
                    <div className="space-y-3">
                      {category.questions.map((question, index) => {
                        const editing = editor?.type === "question" && editor.mode === "edit" && editor.question?.id === question.id && editor.categoryId === category.id
                        return (
                          <div key={question.id} className="rounded-2xl border border-border p-4">
                            {editing ? <QuestionEditor categories={content.categories} categoryId={category.id} question={question} onSave={saveQuestion} onCancel={() => setEditor(null)} saving={saving} /> : (
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0"><p className="font-semibold">{question.question}</p><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{question.answer}</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-2.5 py-1">Posisi {question.position}</span><span className={cn("rounded-full px-2.5 py-1", question.status === "published" ? "bg-[#e6f7ee] text-[#15945b]" : "bg-amber-500/10 text-amber-700")}>{question.status === "published" ? "Terbit" : "Draft"}</span></div></div>
                                <ItemActions first={index === 0} last={index === category.questions.length - 1} saving={saving} onUp={() => void moveQuestion(category.id, question.id, "up")} onDown={() => void moveQuestion(category.id, question.id, "down")} onEdit={() => setEditor({ type: "question", mode: "edit", categoryId: category.id, question })} onDelete={() => setDeleteTarget({ type: "question", categoryId: category.id, questionId: question.id, name: question.question })} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {category.questions.length === 0 && <EmptyState text="Belum ada pertanyaan dalam kategori ini." />}
                    </div>
                  </div>
                ))}
                {content.categories.length === 0 && <EmptyState text="Tambahkan kategori sebelum membuat pertanyaan." />}
              </div>
            </AccordionCard>

            <AccordionCard title="Kontak Bantuan" description="Atur informasi dan tombol kontak pada halaman bantuan." status={supportStatus} open={openSection === "support"} onToggle={() => toggleSection("support")}>
              {editor?.type === "support" ? <SupportEditor support={content.support} onSave={saveSupport} onCancel={() => setEditor(null)} saving={saving} /> : (
                <div className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="font-semibold">{content.support.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{content.support.description}</p><p className="mt-2 text-xs font-semibold text-[#15945b]">{content.support.buttonLabel} · {content.support.href}</p></div>
                  <button type="button" onClick={() => setEditor({ type: "support" })} disabled={saving} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-accent disabled:opacity-50"><Pencil className="h-4 w-4" /> Edit</button>
                </div>
              )}
            </AccordionCard>
          </div>
        ) : null}
      </div>

      {deleteTarget && <DeleteDialog target={deleteTarget} saving={saving} onClose={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} />}
    </MemberLayout>
  )
}

function AccordionCard({
  title,
  description,
  status,
  open,
  onToggle,
  children,
}: {
  title: string
  description: string
  status: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <span className="block text-lg font-bold">{title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground max-w-[100px] sm:max-w-none truncate">
            {status}
          </span>
          <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
        </div>
      </button>
      {open && <div className="border-t border-border p-4 sm:p-6">{children}</div>}
    </section>
  )
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-border bg-background p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>
}

function ItemActions({ first, last, saving, onUp, onDown, onEdit, onDelete }: { first: boolean; last: boolean; saving: boolean; onUp: () => void; onDown: () => void; onEdit: () => void; onDelete: () => void }) {
  const button = "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-accent disabled:opacity-35"
  return <div className="flex shrink-0 gap-1.5"><button type="button" onClick={onUp} disabled={first || saving} className={button} aria-label="Naikkan"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={onDown} disabled={last || saving} className={button} aria-label="Turunkan"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={onEdit} disabled={saving} className={button} aria-label="Edit"><Pencil className="h-4 w-4" /></button><button type="button" onClick={onDelete} disabled={saving} className={cn(button, "border-destructive/20 text-destructive hover:bg-destructive/10")} aria-label="Hapus"><Trash2 className="h-4 w-4" /></button></div>
}

function CategoryEditor({ category, onSave, onCancel, saving }: { category?: HelpCategory; onSave: (values: { id: string; title: string; iconKey: HelpIconKey; visible: boolean }) => void; onCancel: () => void; saving: boolean }) {
  const [id, setId] = useState(category?.id ?? "")
  const [title, setTitle] = useState(category?.title ?? "")
  const [iconKey, setIconKey] = useState<HelpIconKey>(category?.iconKey ?? "help")
  const [visible, setVisible] = useState(category?.visible ?? true)
  return <form onSubmit={(event) => { event.preventDefault(); onSave({ id: id.trim(), title: title.trim(), iconKey, visible }) }} className="mb-4 grid gap-4 rounded-2xl border border-[#15945b]/25 bg-[#e6f7ee]/40 p-4 sm:grid-cols-2 dark:bg-emerald-500/5"><Field label="Nama Kategori"><input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></Field><Field label="Ikon"><select value={iconKey} onChange={(event) => setIconKey(event.target.value as HelpIconKey)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]">{iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field><Field label="ID Kategori"><input value={id} onChange={(event) => setId(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required disabled={Boolean(category)} maxLength={80} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b] disabled:opacity-60" /></Field><label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold"><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} className="h-4 w-4 accent-[#15945b]" /> Tampilkan ke publik</label><EditorActions saving={saving} onCancel={onCancel} /></form>
}

function QuestionEditor({ categories, categoryId, question, onSave, onCancel, saving }: { categories: HelpCategory[]; categoryId: string; question?: HelpQuestion; onSave: (values: { question: string; answer: string; productId?: PublicProductId; status: HelpQuestionStatus; categoryId: string }) => void; onCancel: () => void; saving: boolean }) {
  const [questionText, setQuestionText] = useState(question?.question ?? "")
  const [answer, setAnswer] = useState(question?.answer ?? "")
  const [selectedCategory, setSelectedCategory] = useState(categoryId)
  const [productId, setProductId] = useState<PublicProductId | "">(question?.productId ?? "")
  const [status, setStatus] = useState<HelpQuestionStatus>(question?.status ?? "published")
  return <form onSubmit={(event) => { event.preventDefault(); onSave({ question: questionText.trim(), answer: answer.trim(), productId: productId || undefined, status, categoryId: selectedCategory }) }} className="mb-4 grid gap-4 rounded-2xl border border-[#15945b]/25 bg-[#e6f7ee]/40 p-4 sm:grid-cols-2 dark:bg-emerald-500/5"><Field label="Pertanyaan" wide><input value={questionText} onChange={(event) => setQuestionText(event.target.value)} required maxLength={220} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></Field><Field label="Jawaban" wide><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} required maxLength={1600} rows={5} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b] whitespace-pre-wrap min-h-32 py-3" /></Field><Field label="Kategori"><select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]">{categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></Field><Field label="Status"><select value={status} onChange={(event) => setStatus(event.target.value as HelpQuestionStatus)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]"><option value="published">Terbit</option><option value="draft">Draft</option></select></Field><Field label="Produk terkait (opsional)" wide><select value={productId} onChange={(event) => setProductId(event.target.value as PublicProductId | "")} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]"><option value="">Tidak ada</option>{DEFAULT_PUBLIC_PRODUCTS.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field><EditorActions saving={saving} onCancel={onCancel} /></form>
}

function SupportEditor({ support, onSave, onCancel, saving }: { support: HelpSupport; onSave: (support: HelpSupport) => void; onCancel: () => void; saving: boolean }) {
  const [title, setTitle] = useState(support.title)
  const [description, setDescription] = useState(support.description)
  const [buttonLabel, setButtonLabel] = useState(support.buttonLabel)
  const [href, setHref] = useState(support.href)
  return <form onSubmit={(event) => { event.preventDefault(); onSave({ title: title.trim(), description: description.trim(), buttonLabel: buttonLabel.trim(), href: href.trim() }) }} className="grid gap-4 rounded-2xl border border-[#15945b]/25 bg-[#e6f7ee]/40 p-4 sm:grid-cols-2 dark:bg-emerald-500/5"><Field label="Judul" wide><input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></Field><Field label="Deskripsi" wide><textarea value={description} onChange={(event) => setDescription(event.target.value)} required maxLength={400} rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-[#15945b] whitespace-pre-wrap min-h-24 py-3" /></Field><Field label="Label Tombol"><input value={buttonLabel} onChange={(event) => setButtonLabel(event.target.value)} required maxLength={80} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></Field><Field label="Tautan"><input value={href} onChange={(event) => setHref(event.target.value)} required maxLength={120} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-[#15945b]" /></Field><EditorActions saving={saving} onCancel={onCancel} /></form>
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={cn("space-y-1.5", wide && "sm:col-span-2")}><span className="block text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>
}

function EditorActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={onCancel} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-50"><X className="h-4 w-4" /> Batal</button><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#15945b] px-5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}</button></div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{text}</div>
}

function DeleteDialog({ target, saving, onClose, onConfirm }: { target: DeleteTarget; saving: boolean; onClose: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><div className="w-full rounded-t-3xl bg-card p-6 shadow-xl sm:max-w-md sm:rounded-3xl"><h2 className="text-xl font-bold text-destructive">Hapus {target.type === "category" ? "kategori" : "pertanyaan"}?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{target.type === "category" ? "Semua pertanyaan dalam kategori ini juga akan dihapus." : "Pertanyaan akan dihapus secara permanen."}</p><p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">{target.name}</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-xl border border-border px-5 font-semibold disabled:opacity-50">Batal</button><button type="button" onClick={onConfirm} disabled={saving} className="min-h-11 rounded-xl bg-destructive px-5 font-semibold text-destructive-foreground disabled:opacity-50">{saving ? "Menghapus..." : "Hapus"}</button></div></div></div>
}
