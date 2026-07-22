"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Bell, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Notification } from "@/app/notifikasi/page"

type Result = { notifications: Notification[]; unreadCount: number }
export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false); const [items, setItems] = useState<Notification[]>([]); const [unread, setUnread] = useState(0); const [loaded, setLoaded] = useState(false); const ref = useRef<HTMLDivElement>(null)
  const load = async () => { if (loaded) return; setLoaded(true); const response = await fetch("/api/notifications/me?page=1&limit=5", { cache: "no-store" }); if (!response.ok) return; const data = await response.json() as Result; setItems(data.notifications.slice(0, 5)); setUnread(data.unreadCount) }
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false) }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close) }, [])
  const mark = async (id: string) => { const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" }); if (response.ok) { setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); setUnread((current) => Math.max(0, current - 1)) } }
  return <div className={cn("relative", className)} ref={ref}><button type="button" onClick={() => { setOpen((current) => !current); void load() }} aria-label="Notifikasi" aria-expanded={open} className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unread > 99 ? "99+" : unread}</span>}</button>{open && <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-card shadow-xl"><div className="border-b px-4 py-3"><h2 className="font-semibold">Notifikasi</h2><p className="text-xs text-muted-foreground">{unread} belum dibaca</p></div><div className="max-h-80 overflow-y-auto">{items.length ? items.map((item) => <div key={item.id} className={cn("border-b p-4 last:border-0", !item.readAt && "bg-primary/5")}><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>{!item.readAt && <button type="button" onClick={() => void mark(item.id)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"><Check className="h-3 w-3" />Tandai dibaca</button>}</div>) : <p className="p-5 text-sm text-muted-foreground">Tidak ada notifikasi.</p>}</div><Link href="/notifikasi" onClick={() => setOpen(false)} className="block border-t p-3 text-center text-sm font-semibold text-primary hover:bg-accent">Lihat semua notifikasi</Link></div>}</div>
}
