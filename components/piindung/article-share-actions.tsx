"use client"

import { Check, Copy, MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"

export function ArticleShareActions({ title }: { title: string }) {
  const [url, setUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => setUrl(window.location.href), [])

  const copyLink = async () => {
    if (!url || !navigator.clipboard) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap items-center gap-3" aria-label="Bagikan artikel">
      <button type="button" onClick={() => void copyLink()} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dce8e2] bg-white px-4 text-sm font-semibold text-[#08213b] transition hover:border-[#07965d]/45 hover:text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d] dark:text-white">
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {copied ? "Tersalin" : "Salin Tautan"}
      </button>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dce8e2] bg-white px-4 text-sm font-semibold text-[#08213b] transition hover:border-[#07965d]/45 hover:text-[#07965d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07965d] dark:border-white/10 dark:bg-[#0d1e2d] dark:text-white">
        <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
      </a>
    </div>
  )
}
