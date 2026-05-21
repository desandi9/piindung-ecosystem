"use client"

import { useState } from "react"
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Mail,
  MessageCircle,
  MessageSquareReply,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteInboxMessage,
  getUnreadInboxCount,
  markAllInboxMessagesAsRead,
  replyToInboxMessage,
  type InboxMessage,
  updateInboxMessageStatus,
  useInboxMessages,
} from "@/lib/admin-inbox"
import { addActivityLog } from "@/lib/activity-log"
import { useAuth } from "@/lib/auth-context"
import { normalizeWhatsApp } from "@/lib/contact-social"
import { cn } from "@/lib/utils"

function statusClassName(status: string) {
  if (status === "Unread") return "bg-primary/10 text-primary hover:bg-primary/10"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

function sourceClassName(source: InboxMessage["source"]) {
  if (source === "Kontak Kami") return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
  if (source === "Konsultasi") return "bg-primary/10 text-primary"
  return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
}

function buildReplyLink(message: InboxMessage, replyMessage: string) {
  if (message.senderEmail) {
    return `mailto:${message.senderEmail}?subject=${encodeURIComponent(`Re: ${message.title}`)}&body=${encodeURIComponent(replyMessage)}`
  }

  if (message.senderPhone) {
    return `https://wa.me/${normalizeWhatsApp(message.senderPhone)}?text=${encodeURIComponent(replyMessage)}`
  }

  return null
}

export function AdminInboxContent() {
  const { user } = useAuth()
  const messages = useInboxMessages()
  const unreadCount = getUnreadInboxCount(messages)
  const repliedCount = messages.filter((message) => Boolean(message.repliedAt)).length
  const [replyTarget, setReplyTarget] = useState<InboxMessage | null>(null)
  const [replyBody, setReplyBody] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<InboxMessage | null>(null)

  const handleReply = () => {
    if (!replyTarget || !replyBody.trim()) return

    replyToInboxMessage(replyTarget.id, replyBody.trim())
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Inbox",
      action: `Membalas pesan ${replyTarget.title}`,
      status: "Success",
    })

    const replyLink = buildReplyLink(replyTarget, replyBody.trim())
    if (replyLink) {
      window.open(replyLink, "_blank", "noopener,noreferrer")
    }

    setReplyTarget(null)
    setReplyBody("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Bell className="h-4 w-4 text-primary" />
            Inbox Admin Dashboard
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Pesan Masuk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola pesan dari Kontak Kami, Konsultasi, dan Bantuan secara realtime.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            markAllInboxMessagesAsRead()
            addActivityLog({
              userName: user?.name || "Admin",
              type: "Inbox",
              action: "Menandai semua pesan masuk sebagai dibaca",
              status: "Success",
            })
          }}
          disabled={unreadCount === 0}
          className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20"
        >
          <Check className="h-4 w-4" />
          Tandai Semua Dibaca
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard icon={Bell} title="Total Pesan" value={String(messages.length)} />
        <SummaryCard icon={Clock} title="Belum Dibaca" value={String(unreadCount)} />
        <SummaryCard icon={MessageSquareReply} title="Sudah Dibalas" value={String(repliedCount)} />
      </div>

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daftar Pesan</CardTitle>
          <CardDescription>Kelola status baca, balasan, dan hapus pesan</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Belum ada pesan masuk</p>
              <p className="mt-1 text-sm text-muted-foreground">Pesan dari Kontak Kami, Konsultasi, dan Bantuan akan muncul di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((message) => (
                <div key={message.id} className="p-4 lg:p-5 transition-colors hover:bg-muted/40">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", sourceClassName(message.source))}>
                        {message.source === "Kontak Kami" ? <Mail className="h-5 w-5" /> : message.source === "Konsultasi" ? <MessageCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-sm font-semibold text-foreground">{message.title}</h2>
                          <Badge className={cn("border-0", statusClassName(message.status))}>{message.status}</Badge>
                          <Badge className={cn("border-0", sourceClassName(message.source))}>{message.source}</Badge>
                          {message.repliedAt ? <Badge variant="outline">Sudah Dibalas</Badge> : null}
                        </div>
                        <p className="text-sm text-foreground/90">{message.senderName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {[message.senderEmail, message.senderPhone].filter(Boolean).join(" • ") || "Kontak balasan belum diisi"}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{message.message}</p>
                        {message.replyMessage ? <p className="text-xs text-primary mt-2 line-clamp-2">Balasan terakhir: {message.replyMessage}</p> : null}
                        <p className="text-xs text-muted-foreground mt-2">{message.createdAtLabel}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <ActionButton
                        icon={Eye}
                        label={message.status === "Unread" ? "Tandai Dibaca" : "Tandai Belum Dibaca"}
                        onClick={() => {
                          updateInboxMessageStatus(message.id, message.status === "Unread" ? "Read" : "Unread")
                          addActivityLog({
                            userName: user?.name || "Admin",
                            type: "Inbox",
                            action: `${message.status === "Unread" ? "Menandai dibaca" : "Menandai belum dibaca"} pesan ${message.title}`,
                            status: "Success",
                          })
                        }}
                      />
                      <ActionButton
                        icon={MessageSquareReply}
                        label="Balas"
                        onClick={() => {
                          setReplyTarget(message)
                          setReplyBody(message.replyMessage ?? "")
                          updateInboxMessageStatus(message.id, "Read")
                        }}
                      />
                      <ActionButton icon={Trash2} label="Hapus" destructive onClick={() => setDeleteTarget(message)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(replyTarget)} onOpenChange={(open) => {
        if (!open) {
          setReplyTarget(null)
          setReplyBody("")
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Balas Pesan</DialogTitle>
            <DialogDescription>{replyTarget ? `${replyTarget.source} • ${replyTarget.senderName}` : ""}</DialogDescription>
          </DialogHeader>

          {replyTarget ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">{replyTarget.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {[replyTarget.senderEmail, replyTarget.senderPhone].filter(Boolean).join(" • ") || "Tidak ada kontak balasan"}
                </p>
                <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{replyTarget.message}</p>
              </div>

              <Textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                placeholder="Tulis balasan untuk pengirim"
                className="min-h-32 rounded-xl"
              />

              {!replyTarget.senderEmail && !replyTarget.senderPhone ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">Pesan ini tidak memiliki email atau nomor WhatsApp. Balasan tetap disimpan di inbox admin.</p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReplyTarget(null)}>Batal</Button>
            <Button type="button" onClick={handleReply} disabled={!replyBody.trim()} className="gap-2">
              <MessageSquareReply className="h-4 w-4" />
              Simpan Balasan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pesan</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `Pesan \"${deleteTarget.title}\" akan dihapus dari inbox admin. Tindakan ini tidak dapat dibatalkan.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return
                deleteInboxMessage(deleteTarget.id)
                addActivityLog({
                  userName: user?.name || "Admin",
                  type: "Inbox",
                  action: `Menghapus pesan ${deleteTarget.title}`,
                  status: "Warning",
                })
                setDeleteTarget(null)
              }}
            >
              Hapus Pesan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: typeof Bell; title: string; value: string }) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}

function ActionButton({ icon: Icon, label, destructive, onClick }: { icon: typeof Eye; label: string; destructive?: boolean; onClick?: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-2 rounded-xl hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
        destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
