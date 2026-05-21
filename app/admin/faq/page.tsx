"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { addActivityLog } from "@/lib/activity-log"
import {
  addHelpFaqQuestion,
  deleteHelpFaqQuestion,
  type HelpFaqCategory,
  type HelpFaqItem,
  type HelpFaqIconKey,
  updateHelpFaqQuestion,
  useHelpFaqCategories,
} from "@/lib/faq-manager"
import {
  CreditCard,
  HelpCircle,
  Pencil,
  Plus,
  Settings,
  Shield,
  Trash2,
  Users,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type FaqFormState = {
  categoryId: string
  questionId?: string
  question: string
  answer: string
}

function categoryIcon(iconKey: HelpFaqIconKey) {
  if (iconKey === "credit-card") return CreditCard
  if (iconKey === "shield") return Shield
  if (iconKey === "settings") return Settings
  return Users
}

function emptyForm(categories: HelpFaqCategory[]): FaqFormState {
  return {
    categoryId: categories[0]?.id ?? "",
    question: "",
    answer: "",
  }
}

export default function FaqManagerPage() {
  const { user } = useAuth()
  const categories = useHelpFaqCategories()
  const [formOpen, setFormOpen] = useState(false)
  const [formState, setFormState] = useState<FaqFormState>(emptyForm(categories))
  const [deleteTarget, setDeleteTarget] = useState<{ categoryId: string; question: HelpFaqItem } | null>(null)

  const totalQuestions = useMemo(
    () => categories.reduce((total, category) => total + category.questions.length, 0),
    [categories]
  )

  const handleAdd = (categoryId?: string) => {
    setFormState({
      ...emptyForm(categories),
      categoryId: categoryId ?? categories[0]?.id ?? "",
    })
    setFormOpen(true)
  }

  const handleEdit = (categoryId: string, question: HelpFaqItem) => {
    setFormState({
      categoryId,
      questionId: question.id,
      question: question.q,
      answer: question.a,
    })
    setFormOpen(true)
  }

  const handleSubmit = () => {
    if (!formState.categoryId || !formState.question.trim() || !formState.answer.trim()) return

    if (formState.questionId) {
      updateHelpFaqQuestion(formState.categoryId, formState.questionId, {
        q: formState.question.trim(),
        a: formState.answer.trim(),
      })
      addActivityLog({
        userName: user?.name ?? "Admin",
        type: "Settings",
        action: `Memperbarui FAQ: ${formState.question.trim()}`,
        status: "Success",
      })
    } else {
      addHelpFaqQuestion(formState.categoryId, {
        q: formState.question.trim(),
        a: formState.answer.trim(),
      })
      addActivityLog({
        userName: user?.name ?? "Admin",
        type: "Settings",
        action: `Menambahkan FAQ baru: ${formState.question.trim()}`,
        status: "Success",
      })
    }

    setFormOpen(false)
    setFormState(emptyForm(categories))
  }

  const handleDelete = (categoryId: string, question: HelpFaqItem) => {
    setDeleteTarget({ categoryId, question })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    deleteHelpFaqQuestion(deleteTarget.categoryId, deleteTarget.question.id)
    addActivityLog({
      userName: user?.name ?? "Admin",
      type: "Settings",
      action: `Menghapus FAQ: ${deleteTarget.question.q}`,
      status: "Success",
    })
    setDeleteTarget(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <HelpCircle className="h-4 w-4 text-primary" />
              Konten Bantuan PIINDUNG
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">FAQ Manager</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola pertanyaan dan jawaban yang tampil pada halaman bantuan publik.
            </p>
          </div>
          <Button type="button" className="gap-2 rounded-xl" onClick={() => handleAdd()}>
            <Plus className="h-4 w-4" />
            Tambah FAQ
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard title="Total Kategori" value={String(categories.length)} icon={HelpCircle} />
          <SummaryCard title="Total FAQ" value={String(totalQuestions)} icon={Users} />
          <SummaryCard title="Halaman Terkelola" value="Bantuan" icon={Shield} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {categories.map((category) => {
            const CategoryIcon = categoryIcon(category.iconKey)

            return (
              <Card key={category.id} className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <CardDescription>{category.questions.length} FAQ dalam kategori ini</CardDescription>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => handleAdd(category.id)}>
                      <Plus className="h-4 w-4" />
                      Tambah
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.questions.map((question) => (
                    <div key={question.id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{question.q}</p>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(category.id, question)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive" onClick={() => handleDelete(category.id, question)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{question.a}</p>
                    </div>
                  ))}
                  {category.questions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
                      <p className="text-sm font-semibold text-foreground">Belum ada FAQ</p>
                      <p className="mt-1 text-xs text-muted-foreground">Tambahkan pertanyaan pertama untuk kategori ini.</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{formState.questionId ? "Edit FAQ" : "Tambah FAQ"}</DialogTitle>
              <DialogDescription>Gunakan format pertanyaan dan jawaban yang ringkas dan mudah dipahami.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Kategori</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormState((current) => ({ ...current, categoryId: category.id }))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${formState.categoryId === category.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                    >
                      {category.title}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                value={formState.question}
                onChange={(event) => setFormState((current) => ({ ...current, question: event.target.value }))}
                placeholder="Tulis pertanyaan FAQ"
                className="rounded-xl"
              />
              <Textarea
                value={formState.answer}
                onChange={(event) => setFormState((current) => ({ ...current, answer: event.target.value }))}
                placeholder="Tulis jawaban FAQ"
                className="min-h-36 rounded-xl"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="button" onClick={handleSubmit}>{formState.questionId ? "Simpan Perubahan" : "Tambah FAQ"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ConfirmActionDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Hapus FAQ"
          description={deleteTarget ? `FAQ \"${deleteTarget.question.q}\" akan dihapus dari halaman bantuan.` : ""}
          confirmLabel="Hapus FAQ"
          destructive
          onConfirm={confirmDelete}
        />
      </div>
    </DashboardLayout>
  )
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof HelpCircle }) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 lg:p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="outline">Live</Badge>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}
