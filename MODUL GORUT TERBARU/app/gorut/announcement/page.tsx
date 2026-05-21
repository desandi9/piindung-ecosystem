'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Eye,
  Archive,
  Clock,
  AlertTriangle,
  Download,
  Copy,
} from 'lucide-react'
import type { Announcement, AnnouncementStatus, AnnouncementPriority, AnnouncementCategory } from '@/lib/gorut/types'
import { useAuth } from '@/lib/auth-context'
import { createGorutAnnouncement, deleteGorutAnnouncement, updateGorutAnnouncement, useGorutAnnouncements } from '@/lib/gorut/announcement-control'
import { exportReportToPdf } from '@/lib/gorut/export'
import { cn } from '@/lib/utils'

type FilterStatus = 'semua' | AnnouncementStatus
type FilterPriority = 'semua' | AnnouncementPriority

const statusConfig: Record<AnnouncementStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-500/10' },
  published: { label: 'Published', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  scheduled: { label: 'Scheduled', color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  archived: { label: 'Archived', color: 'text-muted-foreground', bgColor: 'bg-muted' },
}

const priorityConfig: Record<AnnouncementPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-slate-600', bgColor: 'bg-slate-500/10' },
  medium: { label: 'Medium', color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  high: { label: 'High', color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  urgent: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-500/10' },
}

const categoryConfig: Record<AnnouncementCategory, { label: string }> = {
  system: { label: 'System' },
  operasional: { label: 'Operasional' },
  keuangan: { label: 'Keuangan' },
  event: { label: 'Event' },
  maintenance: { label: 'Maintenance' },
}

const audienceLabels: Record<string, string> = {
  all_admins: 'All Admins',
  admin_pc: 'Admin PC',
  upzis: 'UPZIS',
  ranting: 'Ranting',
  plpk: 'PLPK',
  mobile_app_users: 'Mobile App Users',
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AnnouncementPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const announcements = useGorutAnnouncements()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('semua')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('semua')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'scheduled' | 'priority' | 'draft'>('all')

  // Form state for creating/editing
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    category: 'system',
    priority: 'medium',
    audience: [],
    status: 'draft',
    isPinned: false,
  })

  const filteredAnnouncements = useMemo(() => {
    let filtered = announcements

    // Tab filter
    if (activeTab === 'recent') {
      filtered = filtered.filter(a => a.status === 'published')
    } else if (activeTab === 'scheduled') {
      filtered = filtered.filter(a => a.status === 'scheduled')
    } else if (activeTab === 'priority') {
      filtered = filtered.filter(a => a.priority === 'urgent' || a.priority === 'high' || a.isPinned)
    } else if (activeTab === 'draft') {
      filtered = filtered.filter(a => a.status === 'draft')
    }

    // Search
    if (search) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== 'semua') {
      filtered = filtered.filter(a => a.status === filterStatus)
    }

    // Priority filter
    if (filterPriority !== 'semua') {
      filtered = filtered.filter(a => a.priority === filterPriority)
    }

    // Sort: pinned first, then by date
    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      const dateA = new Date(a.publishedAt || a.createdAt).getTime()
      const dateB = new Date(b.publishedAt || b.createdAt).getTime()
      return dateB - dateA
    })
  }, [announcements, search, filterStatus, filterPriority, activeTab])

  const stats = {
    total: announcements.length,
    published: announcements.filter(a => a.status === 'published').length,
    scheduled: announcements.filter(a => a.status === 'scheduled').length,
    draft: announcements.filter(a => a.status === 'draft').length,
    pinned: announcements.filter(a => a.isPinned).length,
  }

  const handleCreateAnnouncement = async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) {
      toast({ variant: 'destructive', title: 'Judul dan konten wajib diisi', description: 'Lengkapi pengumuman sebelum disimpan.' })
      return
    }

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: formData.title || 'Untitled',
      content: formData.content || '',
      category: (formData.category || 'system') as any,
      priority: (formData.priority || 'medium') as any,
      audience: formData.audience || [],
      status: (formData.status || 'draft') as any,
      isPinned: formData.isPinned || false,
      createdBy: user?.name || 'Super Admin',
      createdAt: new Date().toISOString(),
      publishedAt: formData.status === 'published' ? new Date().toISOString() : undefined,
      scheduledAt: formData.status === 'scheduled' ? formData.scheduledAt : undefined,
    }

    try {
      await createGorutAnnouncement(newAnnouncement)
      toast({ variant: 'default', title: 'Pengumuman dibuat', description: `Draft ${newAnnouncement.title} berhasil disimpan.` })
      resetForm()
      setCreateOpen(false)
    } catch {
      toast({ variant: 'destructive', title: 'Gagal membuat pengumuman', description: 'Data pengumuman belum berhasil disimpan.' })
    }
  }

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return
    if (!formData.title?.trim() || !formData.content?.trim()) {
      toast({ variant: 'destructive', title: 'Judul dan konten wajib diisi', description: 'Lengkapi pengumuman sebelum disimpan.' })
      return
    }

    try {
      await updateGorutAnnouncement(editingAnnouncement.id, {
        ...formData,
        publishedAt:
          formData.status === 'published' && !editingAnnouncement.publishedAt
            ? new Date().toISOString()
            : editingAnnouncement.publishedAt,
      })
      toast({ variant: 'default', title: 'Pengumuman diperbarui', description: `${formData.title} berhasil diperbarui.` })
      resetForm()
      setEditOpen(false)
    } catch {
      toast({ variant: 'destructive', title: 'Gagal memperbarui pengumuman', description: 'Perubahan belum berhasil disimpan.' })
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await updateGorutAnnouncement(id, { status: 'published', publishedAt: new Date().toISOString() })
      toast({ variant: 'default', title: 'Pengumuman dipublish', description: 'Pengumuman sekarang tayang ke audiens terkait.' })
    } catch {
      toast({ variant: 'destructive', title: 'Gagal publish pengumuman', description: 'Status publish belum berhasil diperbarui.' })
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await updateGorutAnnouncement(id, { status: 'archived', archivedAt: new Date().toISOString() })
      toast({ variant: 'default', title: 'Pengumuman diarsipkan', description: 'Pengumuman dipindahkan ke arsip.' })
    } catch {
      toast({ variant: 'destructive', title: 'Gagal mengarsipkan pengumuman', description: 'Status arsip belum berhasil diperbarui.' })
    }
  }

  const handlePin = async (id: string) => {
    const target = announcements.find((a) => a.id === id)
    try {
      await updateGorutAnnouncement(id, { isPinned: !target?.isPinned })
      toast({ variant: 'default', title: target?.isPinned ? 'Pin dilepas' : 'Pengumuman dipin', description: 'Prioritas pengumuman berhasil diperbarui.' })
    } catch {
      toast({ variant: 'destructive', title: 'Gagal memperbarui pin', description: 'Prioritas pengumuman belum berhasil diperbarui.' })
    }
  }

  const handleDelete = async (id: string) => {
    const target = announcements.find((a) => a.id === id)
    try {
      await deleteGorutAnnouncement(id)
      toast({ variant: 'default', title: 'Pengumuman dihapus', description: target ? `${target.title} dihapus dari daftar.` : 'Item dihapus.' })
    } catch {
      toast({ variant: 'destructive', title: 'Gagal menghapus pengumuman', description: 'Pengumuman belum berhasil dihapus.' })
    }
  }

  const handleDuplicate = async (announcement: Announcement) => {
    const duplicated: Announcement = {
      ...announcement,
      id: `${Date.now()}`,
      title: `${announcement.title} (Copy)`,
      status: 'draft',
      isPinned: false,
      createdAt: new Date().toISOString(),
      publishedAt: undefined,
      scheduledAt: undefined,
      archivedAt: undefined,
    }
    try {
      await createGorutAnnouncement(duplicated)
      toast({ variant: 'default', title: 'Pengumuman diduplikasi', description: `Salinan draft untuk ${announcement.title} berhasil dibuat.` })
    } catch {
      toast({ variant: 'destructive', title: 'Gagal menduplikasi pengumuman', description: 'Salinan draft belum berhasil dibuat.' })
    }
  }

  const handleExportPdf = () => {
    exportReportToPdf({
      title: 'Laporan Pusat Pengumuman GORUT',
      subtitle: `Total ${filteredAnnouncements.length} pengumuman sesuai filter aktif`,
      summary: [
        { label: 'Total', value: String(stats.total) },
        { label: 'Terbit', value: String(stats.published) },
        { label: 'Terjadwal', value: String(stats.scheduled) },
        { label: 'Dipin', value: String(stats.pinned) },
      ],
      tables: [{
        title: 'Daftar Pengumuman',
        columns: ['Judul', 'Kategori', 'Prioritas', 'Status', 'Audience', 'Created By'],
        rows: filteredAnnouncements.map((item) => [
          item.title,
          categoryConfig[item.category].label,
          priorityConfig[item.priority].label,
          statusConfig[item.status].label,
          item.audience.map((aud) => audienceLabels[aud] || aud).join(', ') || '-',
          item.createdBy,
        ]),
      }],
      notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
    })
  }

  const openEditForm = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData(announcement)
    setEditOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'system',
      priority: 'medium',
      audience: [],
      status: 'draft',
      isPinned: false,
    })
    setEditingAnnouncement(null)
  }

  const openCreateForm = () => {
    resetForm()
    setCreateOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="size-8 text-emerald-600" />
            Pusat Pengumuman
          </h1>
          <p className="text-muted-foreground mt-1">Kelola dan distribusikan pengumuman sistem untuk seluruh tim.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPdf} className="gap-2">
            <Download className="size-4" />
            Export PDF
          </Button>
          <Button onClick={openCreateForm} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="size-4" />
            Buat Pengumuman
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Pengumuman</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{stats.published}</p>
              <p className="text-sm text-muted-foreground mt-1">Terbit</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm border-blue-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.scheduled}</p>
              <p className="text-sm text-muted-foreground mt-1">Terjadwal</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm border-slate-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-600">{stats.draft}</p>
              <p className="text-sm text-muted-foreground mt-1">Draft</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm border-amber-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.pinned}</p>
              <p className="text-sm text-muted-foreground mt-1">Dipin</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Semua Pengumuman' },
          { id: 'recent', label: 'Terbaru' },
          { id: 'scheduled', label: 'Terjadwal' },
          { id: 'priority', label: 'Prioritas' },
          { id: 'draft', label: 'Draft' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
              activeTab === tab.id
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari pengumuman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Terbit</SelectItem>
            <SelectItem value="scheduled">Terjadwal</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as FilterPriority)}>
          <SelectTrigger className="w-40 bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Prioritas</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Megaphone className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No announcements found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const status = statusConfig[announcement.status]
            const priority = priorityConfig[announcement.priority]
            const category = categoryConfig[announcement.category as AnnouncementCategory]

            return (
              <Card
                key={announcement.id}
                className={cn(
                  'border-border/40 bg-card/50 backdrop-blur-sm hover:border-border/60 cursor-pointer transition-all',
                  announcement.isPinned && 'border-amber-500/30 bg-amber-500/5'
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Pin Indicator */}
                    <div>
                      {announcement.isPinned && (
                        <Pin className="size-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0" onClick={() => {
                      setSelectedAnnouncement(announcement)
                      setDetailOpen(true)
                    }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground line-clamp-2">{announcement.title}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {announcement.status === 'scheduled' && announcement.scheduledAt && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              {new Date(announcement.scheduledAt).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{announcement.content}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn('border-0', status.bgColor)}>
                          <span className={status.color}>{status.label}</span>
                        </Badge>
                        <Badge variant="outline" className={cn('border-0', priority.bgColor)}>
                          <span className={priority.color}>{priority.label}</span>
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500/10">
                          <span className="text-blue-600">{category.label}</span>
                        </Badge>
                        {announcement.audience.length > 0 && (
                          <Badge variant="outline" className="bg-slate-500/10">
                            <span className="text-slate-600">{announcement.audience.length} audience(s)</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePin(announcement.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {announcement.isPinned ? (
                          <PinOff className="size-4" />
                        ) : (
                          <Pin className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(announcement)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      {announcement.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePublish(announcement.id)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Eye className="size-4" />
                        </Button>
                      )}
                      {announcement.status !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(announcement.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Archive className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(announcement)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
          {selectedAnnouncement && (
            <>
              <div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4">
                <SheetHeader className="pb-0">
                  <SheetTitle className="text-xl flex items-center gap-2">
                    {selectedAnnouncement.isPinned && <Pin className="size-4 text-amber-500 fill-amber-500" />}
                    {selectedAnnouncement.title}
                  </SheetTitle>
                  <SheetDescription>
                    {statusConfig[selectedAnnouncement.status].label} • {priorityConfig[selectedAnnouncement.priority].label}
                  </SheetDescription>
                </SheetHeader>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6 px-6 py-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Content</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Category</h3>
                      <p className="text-sm">{categoryConfig[selectedAnnouncement.category as AnnouncementCategory].label}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Created</h3>
                      <p className="text-sm">{formatDateTime(selectedAnnouncement.createdAt)}</p>
                    </div>
                    {selectedAnnouncement.publishedAt && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Published</h3>
                        <p className="text-sm">{formatDateTime(selectedAnnouncement.publishedAt)}</p>
                      </div>
                    )}
                    {selectedAnnouncement.scheduledAt && (
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Scheduled For</h3>
                        <p className="text-sm">{formatDateTime(selectedAnnouncement.scheduledAt)}</p>
                      </div>
                    )}
                  </div>

                  {selectedAnnouncement.audience.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">Target Audience</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnnouncement.audience.map(aud => (
                          <Badge key={aud} variant="outline" className="bg-slate-500/10">
                            <span className="text-slate-600">{audienceLabels[aud] || aud}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Created By</h3>
                    <p className="text-sm">{selectedAnnouncement.createdBy}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create/Edit Sheet */}
      <Sheet open={createOpen || editOpen} onOpenChange={(open) => {
        if (!open) resetForm()
        if (createOpen) setCreateOpen(open)
        else setEditOpen(open)
      }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
          <div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4">
            <SheetHeader className="pb-0">
              <SheetTitle className="text-xl">
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </SheetTitle>
              <SheetDescription>
                {editingAnnouncement ? `Editing: ${editingAnnouncement.title}` : 'Create a new announcement for the team'}
              </SheetDescription>
            </SheetHeader>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-6 py-6">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title..."
                  className="mt-2 bg-background/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Announcement content..."
                  rows={5}
                  className="mt-2 w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={formData.category || 'system'} onValueChange={(value) => setFormData({ ...formData, category: value as any })}>
                    <SelectTrigger className="mt-2 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={formData.priority || 'medium'} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                    <SelectTrigger className="mt-2 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formData.status || 'draft'} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                  <SelectTrigger className="mt-2 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'scheduled' && (
                <div>
                  <label className="text-sm font-medium">Scheduled Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: new Date(e.target.value).toISOString() })}
                    className="mt-2 bg-background/50"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Target Audience</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(audienceLabels).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.audience || []).includes(key as any)}
                        onChange={(e) => {
                          const newAudience = e.target.checked
                            ? [...(formData.audience || []), key as any]
                            : (formData.audience || []).filter(a => a !== key)
                          setFormData({ ...formData, audience: newAudience })
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{value}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={formData.isPinned || false}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="pinned" className="text-sm font-medium cursor-pointer">
                  Pin this announcement (highlight as priority)
                </label>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-6 px-6 -mx-6 flex gap-2 border-t border-border/50">
            <Button variant="outline" className="flex-1" onClick={() => {
              resetForm()
              setCreateOpen(false)
              setEditOpen(false)
            }}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={editingAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
            >
              {editingAnnouncement ? 'Update' : 'Create'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
