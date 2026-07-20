"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Download, FileText, Search } from "lucide-react"
import { Navbar } from "@/components/piindung/navbar"
import { PublicFooter } from "@/components/piindung/public-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDownloadSize, type PublicDownloadContent, type PublicDownloadItem } from "@/lib/download-content"

type PublicResponse = { content: PublicDownloadContent }

function isPublicResponse(value: unknown): value is PublicResponse {
  return typeof value === "object" && value !== null && "content" in value
}

export default function DownloadPage() {
  const [content, setContent] = useState<PublicDownloadContent | null>(null)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")

  const load = useCallback(async () => {
    setError(false)
    try {
      const response = await fetch("/api/download-content")
      const data: unknown = await response.json()
      if (!response.ok || !isPublicResponse(data)) throw new Error("Invalid download response")
      setContent(data.content)
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id")
    return (content?.items ?? []).filter(item =>
      (category === "all" || item.categoryId === category) &&
      (!needle || `${item.title} ${item.description}`.toLocaleLowerCase("id").includes(needle)),
    )
  }, [content, query, category])

  if (error) return <Shell><div className="mx-auto max-w-xl px-4 py-24 text-center"><p>Pusat dokumen tidak dapat dimuat.</p><Button className="mt-4" onClick={() => void load()}>Coba lagi</Button></div></Shell>
  if (!content) return <Shell><div aria-label="Memuat dokumen" className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-20"><div className="h-12 rounded bg-muted"/><div className="grid gap-4 md:grid-cols-2"><div className="h-48 rounded bg-muted"/><div className="h-48 rounded bg-muted"/></div></div></Shell>

  return <Shell>
    <section className="bg-gradient-to-br from-emerald-950 to-emerald-700 px-4 py-20 text-white">
      <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold tracking-[.2em]">{content.hero.eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-bold sm:text-6xl">{content.hero.title} <span className="text-emerald-300">{content.hero.highlightedText}</span></h1><p className="mt-5 max-w-2xl text-emerald-50">{content.hero.description}</p></div>
    </section>
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">Cari dokumen</span><Search aria-hidden="true" className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground"/><Input className="h-12 pl-12" value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari dokumen..."/></label>
        <div aria-label="Filter kategori" className="flex gap-2 overflow-x-auto pb-1"><Filter active={category === "all"} onClick={() => setCategory("all")}>Semua</Filter>{content.categories.map(item => <Filter key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{item.name}</Filter>)}</div>
      </div>
      {items.length ? <div className="mt-8 space-y-12">{items.some(item => item.featured) && <section><h2 className="text-2xl font-bold">Dokumen unggulan</h2><div className="mt-5 grid gap-5 md:grid-cols-2">{items.filter(item => item.featured).map(item => <DocumentCard key={item.id} item={item}/>)}</div></section>}{items.some(item => !item.featured) && <section><h2 className="text-2xl font-bold">Dokumen lainnya</h2><div className="mt-5 grid gap-5 md:grid-cols-2">{items.filter(item => !item.featured).map(item => <DocumentCard key={item.id} item={item}/>)}</div></section>}</div> : <div className="py-20 text-center"><FileText aria-hidden="true" className="mx-auto h-12 w-12 text-muted-foreground"/><h2 className="mt-4 text-xl font-semibold">Dokumen tidak ditemukan</h2><p className="mt-2 text-muted-foreground">Coba kata kunci atau kategori lain.</p></div>}
    </main>
    {content.callToAction.visible && <section className="bg-emerald-950 px-4 py-14 text-white"><div className="mx-auto max-w-6xl"><p className="text-sm font-semibold tracking-widest text-emerald-300">{content.callToAction.eyebrow}</p><h2 className="mt-3 text-3xl font-bold">{content.callToAction.title}</h2><p className="mt-3 max-w-2xl text-emerald-50">{content.callToAction.description}</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link href={content.callToAction.primaryHref}>{content.callToAction.primaryLabel}</Link></Button><Button asChild variant="outline"><Link href={content.callToAction.secondaryHref}>{content.callToAction.secondaryLabel}</Link></Button></div></div></section>}
  </Shell>
}

function DocumentCard({ item }: { item: PublicDownloadItem }) {
  const href = item.sourceType === "uploaded" ? item.file?.url : item.externalUrl
  return <article className="rounded-2xl border bg-card p-6 shadow-sm"><div className="flex items-start gap-4"><div className="rounded-xl bg-emerald-100 p-3 text-emerald-800"><FileText aria-hidden="true"/></div><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.description}</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{item.fileType}</span>{item.version && <span>Versi {item.version}</span>}{item.file && <span>{formatDownloadSize(item.file.fileSize)}</span>}{item.updatedLabel && <span>{item.updatedLabel}</span>}</div>{href && <Button asChild className="mt-5"><a href={href} target={item.sourceType === "external" ? "_blank" : undefined} rel={item.sourceType === "external" ? "noopener noreferrer" : undefined} download={item.sourceType === "uploaded" ? item.file?.originalDisplayName : undefined}><Download aria-hidden="true" className="mr-2 h-4 w-4"/>Unduh dokumen</a></Button>}</div></div></article>
}

function Filter({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={active} className={`min-h-11 whitespace-nowrap rounded-xl border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 ${active ? "bg-emerald-700 text-white" : "bg-card"}`} onClick={onClick}>{children}</button> }
function Shell({ children }: { children: React.ReactNode }) { return <div className="flex min-h-screen flex-col overflow-x-hidden bg-background"><Navbar/><div className="flex-1">{children}</div><PublicFooter/></div> }
