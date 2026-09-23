"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowLeft, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { MemberLayout } from "@/components/landing-page/member-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { DEFAULT_DOWNLOAD_CONTENT, type DownloadCategory, type DownloadContent, type DownloadFile, type DownloadItem } from "@/lib/download-content"

type ManageResponse = { content: DownloadContent }
type UploadResponse = { file: DownloadFile }
type ErrorResponse = { error?: string }

function hasContent(value: unknown): value is ManageResponse { return typeof value === "object" && value !== null && "content" in value }
function hasFile(value: unknown): value is UploadResponse { return typeof value === "object" && value !== null && "file" in value }
function errorMessage(value: unknown, fallback: string) { return typeof value === "object" && value !== null && "error" in value && typeof (value as ErrorResponse).error === "string" ? (value as ErrorResponse).error ?? fallback : fallback }
function id(prefix: string) { return `${prefix}-${crypto.randomUUID()}` }

export default function ManageDownloadPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [ready, setReady] = useState(false)
  const [content, setContent] = useState<DownloadContent>(DEFAULT_DOWNLOAD_CONTENT)
  const [initial, setInitial] = useState<DownloadContent>(DEFAULT_DOWNLOAD_CONTENT)
  const [isPending, startTransition] = useTransition()
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace("/login?next=/dashboard/landing-page/download")
    else if (user.role !== "super_admin_pc") router.replace("/dashboard")
    else setReady(true)
  }, [user, isLoading, router])

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/download-content/manage")
      const data: unknown = await response.json()
      if (!response.ok || !hasContent(data)) throw new Error("Invalid manage response")
      setContent(data.content)
      setInitial(data.content)
    } catch {
      toast.error("Gagal memuat data dokumen.")
    }
  }, [])

  useEffect(() => { if (ready) void load() }, [ready, load])

  const save = () => startTransition(async () => {
    try {
      const response = await fetch("/api/download-content/manage", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) })
      const data: unknown = await response.json()
      if (!response.ok || !hasContent(data)) throw new Error(errorMessage(data, "Gagal menyimpan konten."))
      setContent(data.content)
      setInitial(data.content)
      toast.success("Konten berhasil disimpan.")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan konten.")
    }
  })

  const addCategory = () => setContent(current => ({ ...current, categories: [...current.categories, { id: id("category"), name: "", description: "", visible: false, position: current.categories.length }] }))
  const addDocument = () => {
    if (!content.categories.length) { toast.error("Buat kategori terlebih dahulu."); return }
    const item: DownloadItem = { id: id("document"), title: "", description: "", categoryId: content.categories[0].id, sourceType: "external", externalUrl: "", fileType: "PDF", featured: false, visible: false, position: content.items.length }
    setContent(current => ({ ...current, items: [...current.items, item] }))
  }
  const updateCategory = (itemId: string, change: Partial<DownloadCategory>) => setContent(current => ({ ...current, categories: current.categories.map(item => item.id === itemId ? { ...item, ...change } : item) }))
  const updateItem = (itemId: string, change: Partial<DownloadItem>) => setContent(current => ({ ...current, items: current.items.map(item => item.id === itemId ? { ...item, ...change } : item) }))
  const moveItem = (itemId: string, direction: -1 | 1) => setContent(current => { const index = current.items.findIndex(item => item.id === itemId); const target = index + direction; if (index < 0 || target < 0 || target >= current.items.length) return current; const items = [...current.items]; [items[index], items[target]] = [items[target], items[index]]; return { ...current, items: items.map((item, position) => ({ ...item, position })) } })

  const upload = async (itemId: string, file: File | undefined) => {
    if (!file) return
    setUploadingId(itemId)
    try {
      const form = new FormData(); form.append("file", file)
      const response = await fetch("/api/download-content/upload", { method: "POST", body: form })
      const data: unknown = await response.json()
      if (!response.ok || !hasFile(data)) throw new Error(errorMessage(data, "Upload gagal."))
      updateItem(itemId, { sourceType: "uploaded", file: data.file, externalUrl: undefined, fileType: file.name.split(".").pop()?.toUpperCase() ?? "" })
      toast.success("File berhasil diunggah. Simpan konten untuk menerbitkannya.")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload gagal.")
    } finally {
      setUploadingId(null)
    }
  }

  if (!ready) return null
  const dirty = JSON.stringify(content) !== JSON.stringify(initial)

  return <MemberLayout>
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><Button asChild variant="ghost"><Link href="/dashboard/landing-page"><ArrowLeft className="mr-2 h-4 w-4"/>Kembali</Link></Button><h1 className="mt-2 text-3xl font-bold">Kelola Pusat Dokumen</h1></div><Button disabled={!dirty || isPending || uploadingId !== null} onClick={save}><Save className="mr-2 h-4 w-4"/>{isPending ? "Menyimpan..." : "Simpan perubahan"}</Button></div>

      <Card><CardHeader><CardTitle>Halaman publik</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Eyebrow" value={content.hero.eyebrow} onChange={eyebrow => setContent(current => ({ ...current, hero: { ...current.hero, eyebrow } }))}/><Field label="Judul" value={content.hero.title} onChange={title => setContent(current => ({ ...current, hero: { ...current.hero, title } }))}/><Field label="Teks sorotan" value={content.hero.highlightedText} onChange={highlightedText => setContent(current => ({ ...current, hero: { ...current.hero, highlightedText } }))}/><div className="md:col-span-2"><Label>Deskripsi</Label><Textarea value={content.hero.description} onChange={event => setContent(current => ({ ...current, hero: { ...current.hero, description: event.target.value } }))}/></div></CardContent></Card>

      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Kategori</CardTitle><Button type="button" variant="outline" onClick={addCategory}><Plus className="mr-2 h-4 w-4"/>Kategori</Button></CardHeader><CardContent className="space-y-4">{content.categories.map(category => <div key={category.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_2fr_auto]"><Field label="Nama" value={category.name} onChange={name => updateCategory(category.id, { name })}/><Field label="Deskripsi" value={category.description} onChange={description => updateCategory(category.id, { description })}/><div className="flex items-end gap-2"><Button type="button" variant="outline" aria-label={category.visible ? "Sembunyikan kategori" : "Tampilkan kategori"} onClick={() => updateCategory(category.id, { visible: !category.visible })}>{category.visible ? <Eye/> : <EyeOff/>}</Button><Button type="button" variant="destructive" aria-label="Hapus kategori" disabled={content.items.some(item => item.categoryId === category.id)} onClick={() => setContent(current => ({ ...current, categories: current.categories.filter(item => item.id !== category.id) }))}><Trash2/></Button></div></div>)}</CardContent></Card>

      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Dokumen</CardTitle><Button type="button" onClick={addDocument}><Plus className="mr-2 h-4 w-4"/>Dokumen baru</Button></CardHeader><CardContent className="space-y-5">{content.items.map((item, index) => <article key={item.id} className="space-y-4 rounded-xl border p-4"><div className="flex justify-between gap-3"><h2 className="font-semibold">{item.title || "Dokumen baru"}</h2><div className="flex gap-2"><Button type="button" size="icon" variant="outline" disabled={index === 0} onClick={() => moveItem(item.id, -1)} aria-label="Naikkan"><ArrowUp/></Button><Button type="button" size="icon" variant="outline" disabled={index === content.items.length - 1} onClick={() => moveItem(item.id, 1)} aria-label="Turunkan"><ArrowDown/></Button><Button type="button" size="icon" variant="destructive" onClick={() => setContent(current => ({ ...current, items: current.items.filter(value => value.id !== item.id) }))} aria-label="Hapus"><Trash2/></Button></div></div><div className="grid gap-4 md:grid-cols-2"><Field label="Judul" value={item.title} onChange={title => updateItem(item.id, { title })}/><label className="space-y-2"><Label>Kategori</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={item.categoryId} onChange={event => updateItem(item.id, { categoryId: event.target.value })}>{content.categories.map(category => <option key={category.id} value={category.id}>{category.name || "Tanpa nama"}</option>)}</select></label><div className="md:col-span-2"><Label>Deskripsi</Label><Textarea value={item.description} onChange={event => updateItem(item.id, { description: event.target.value })}/></div><Field label="Jenis file" value={item.fileType} onChange={fileType => updateItem(item.id, { fileType })}/><Field label="Versi (opsional)" value={item.version ?? ""} onChange={version => updateItem(item.id, { version: version || undefined })}/><label className="space-y-2"><Label>Sumber</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={item.sourceType} onChange={event => updateItem(item.id, event.target.value === "uploaded" ? { sourceType: "uploaded", externalUrl: undefined } : { sourceType: "external", file: undefined })}><option value="external">Tautan eksternal</option><option value="uploaded">Upload file</option></select></label>{item.sourceType === "external" ? <Field label="URL HTTPS" value={item.externalUrl ?? ""} onChange={externalUrl => updateItem(item.id, { externalUrl })}/> : <label className="space-y-2"><Label>File PDF/DOCX/XLSX/PPTX (maks. 20 MB)</Label><Input type="file" accept=".pdf,.docx,.xlsx,.pptx" disabled={uploadingId !== null} onChange={event => void upload(item.id, event.target.files?.[0])}/>{item.file && <p className="text-sm text-muted-foreground">{item.file.originalDisplayName}</p>}</label>}</div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => updateItem(item.id, { visible: !item.visible, featured: item.visible ? false : item.featured })}>{item.visible ? <Eye className="mr-2 h-4 w-4"/> : <EyeOff className="mr-2 h-4 w-4"/>}{item.visible ? "Publik" : "Draf"}</Button><Button type="button" variant="outline" disabled={!item.visible} onClick={() => updateItem(item.id, { featured: !item.featured })}>{item.featured ? "Unggulan" : "Jadikan unggulan"}</Button></div></article>)}</CardContent></Card>
    </div>
  </MemberLayout>
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="space-y-2"><Label>{label}</Label><Input value={value} onChange={event => onChange(event.target.value)}/></label> }
