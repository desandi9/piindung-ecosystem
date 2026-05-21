'use client'

import { useRef, useState, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  FileText,
  Search,
  Upload,
  FolderPlus,
  Download,
  Trash2,
  Archive,
  Clock,
  FileUp,
  Eye,
  Edit2,
  Share2,
} from 'lucide-react'
import { archiveFiles, archiveActivities, archiveCategories } from '@/lib/gorut/data'
import { exportReportToPdf } from '@/lib/gorut/export'
import type { ArchiveFile } from '@/lib/gorut/types'
import { cn } from '@/lib/utils'

export default function ArchivePage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedFile, setSelectedFile] = useState<ArchiveFile | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [files, setFiles] = useState<ArchiveFile[]>(archiveFiles)
  const [folderOpen, setFolderOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase()) || file.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || file.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [files, search, categoryFilter, statusFilter])

  const stats = {
    totalFiles: files.length,
    monthlyReports: files.filter((f) => f.category === 'monthly_reports').length,
    financialDocs: files.filter((f) => f.category === 'financial_reports').length,
    meetingDocs: files.filter((f) => f.category === 'meeting_minutes').length,
    exportFiles: files.filter((f) => f.category === 'export_files').length,
    recentUploads: archiveActivities.filter((a) => a.activityType === 'file_uploaded').length,
  }

  const getFileSizeDisplay = (mb: number) => {
    if (mb < 1) return `${Math.round(mb * 1024)} KB`
    return `${mb.toFixed(1)} MB`
  }

  const getCategoryLabel = (category: string) => archiveCategories.find((c) => c.id === category)?.label || category
  const getCategoryColor = (category: string) => archiveCategories.find((c) => c.id === category)?.color

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return '📄'
      case 'xlsx':
      case 'xls': return '📊'
      case 'docx':
      case 'doc': return '📝'
      case 'csv': return '📋'
      default: return '📎'
    }
  }

  const handleViewDetails = (file: ArchiveFile) => {
    setSelectedFile(file)
    setSheetOpen(true)
  }

  const handleArchive = (fileId: string) => {
    const file = files.find((item) => item.id === fileId)
    setFiles((prev) => prev.map((item) => item.id === fileId ? { ...item, status: 'archived' } : item))
    toast({ variant: 'default', title: 'Dokumen diarsipkan', description: file ? `${file.name} dipindahkan ke arsip.` : 'Dokumen dipindahkan ke arsip.' })
  }

  const handleDelete = (fileId: string) => {
    const file = files.find((item) => item.id === fileId)
    setFiles((prev) => prev.map((item) => item.id === fileId ? { ...item, status: 'deleted' } : item))
    toast({ variant: 'default', title: 'Dokumen ditandai hapus', description: file ? `${file.name} masuk antrian penghapusan.` : 'Dokumen masuk antrian penghapusan.' })
  }

  const handleDownload = (fileName: string) => {
    const content = `Arsip lokal\nNama: ${fileName}\nDownloaded: ${new Date().toISOString()}\n`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName.replace(/\s+/g, '-').toLowerCase()
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleExportList = () => {
    exportReportToPdf({
      title: 'Laporan Digital Archive GORUT',
      subtitle: `Total ${filteredFiles.length} dokumen sesuai filter aktif`,
      summary: [
        { label: 'Total Files', value: String(stats.totalFiles) },
        { label: 'Filtered Files', value: String(filteredFiles.length) },
        { label: 'Exported Files', value: String(stats.exportFiles) },
        { label: 'Recent Uploads', value: String(stats.recentUploads) },
      ],
      tables: [{
        title: 'Daftar Dokumen Arsip',
        columns: ['Nama', 'Kategori', 'Status', 'Ukuran', 'Uploader', 'Tanggal'],
        rows: filteredFiles.map((file) => [file.name, getCategoryLabel(file.category), file.status, getFileSizeDisplay(file.fileSize), file.uploadedBy, new Date(file.uploadDate).toLocaleDateString('id-ID')]),
      }],
      notes: ['Gunakan Print to PDF pada dialog browser untuk menyimpan file.'],
    })
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase() || 'file'
    const created: ArchiveFile = {
      id: `local-${Date.now()}`,
      name: file.name,
      category: 'internal_documents',
      uploadDate: new Date().toISOString(),
      uploadedBy: 'Super Admin',
      fileSize: Math.max(0.01, Number((file.size / (1024 * 1024)).toFixed(2))),
      fileType: extension,
      status: 'active',
      tags: ['local-upload'],
      description: 'Dokumen diunggah dari browser lokal.',
    }

    setFiles((prev) => [created, ...prev])
    toast({ variant: 'default', title: 'File diunggah', description: `${file.name} berhasil ditambahkan ke daftar arsip lokal.` })
    event.target.value = ''
  }

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast({ variant: 'destructive', title: 'Nama kategori kosong', description: 'Masukkan nama kategori baru terlebih dahulu.' })
      return
    }
    toast({ variant: 'default', title: 'Kategori dibuat', description: `${newCategoryName.trim()} siap dipakai untuk pengelompokan dokumen.` })
    setNewCategoryName('')
    setFolderOpen(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Digital Archive</h1>
        <p className="text-muted-foreground mt-2">Kelola dan arsipkan dokumen penting organisasi.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Total Archived Files</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.totalFiles}</div><p className="text-xs text-muted-foreground mt-2">Dokumen tersimpan</p></CardContent></Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Monthly Reports</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-blue-500">{stats.monthlyReports}</div><p className="text-xs text-muted-foreground mt-2">Laporan bulanan</p></CardContent></Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Financial Documents</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-emerald-500">{stats.financialDocs}</div><p className="text-xs text-muted-foreground mt-2">Dokumen keuangan</p></CardContent></Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Meeting Documents</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-violet-500">{stats.meetingDocs}</div><p className="text-xs text-muted-foreground mt-2">Dokumen rapat</p></CardContent></Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Exported Files</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-cyan-500">{stats.exportFiles}</div><p className="text-xs text-muted-foreground mt-2">File ekspor</p></CardContent></Card>
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Recent Uploads</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-amber-500">{stats.recentUploads}</div><p className="text-xs text-muted-foreground mt-2">Unggahan terakhir</p></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleUploadClick} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Upload className="size-4" />Upload File</Button>
        <Button onClick={() => setFolderOpen(true)} variant="outline" className="gap-2"><FolderPlus className="size-4" />New Category</Button>
        <Button variant="outline" className="gap-2" onClick={handleExportList}><Download className="size-4" />Export List</Button>
      </div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadFile} />

      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="Cari dokumen atau tags..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter Kategori" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Kategori</SelectItem>{archiveCategories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Filter Status" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem><SelectItem value="deleted">Deleted</SelectItem></SelectContent></Select>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-lg flex items-center gap-2"><FileText className="size-5" />Archive Files</CardTitle><CardDescription>Total {filteredFiles.length} dokumen</CardDescription></div><Badge variant="outline">{filteredFiles.length} files</Badge></div></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredFiles.length === 0 ? <div className="text-center py-8 text-muted-foreground">Tidak ada dokumen yang cocok dengan filter</div> : filteredFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-background/50 hover:bg-background/80 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl">{getFileIcon(file.fileType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn('text-xs', getCategoryColor(file.category))}>{getCategoryLabel(file.category)}</Badge>
                      <Badge variant="outline" className={cn('text-xs', file.status === 'active' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600', file.status === 'archived' && 'border-amber-500/30 bg-amber-500/10 text-amber-600', file.status === 'deleted' && 'border-red-500/30 bg-red-500/10 text-red-600')}>{file.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{file.uploadedBy} • {getFileSizeDisplay(file.fileSize)} • {new Date(file.uploadDate).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="size-8" onClick={() => handleViewDetails(file)}><Eye className="size-4" /></Button>
                  <Button size="sm" variant="ghost" className="size-8" onClick={() => handleDownload(file.name)}><Download className="size-4" /></Button>
                  {file.status === 'active' && <Button size="sm" variant="ghost" className="size-8" onClick={() => handleArchive(file.id)}><Archive className="size-4" /></Button>}
                  <Button size="sm" variant="ghost" className="size-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(file.id)}><Trash2 className="size-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="size-5" />Recent Archive Activity</CardTitle><CardDescription>Aktivitas terbaru dalam 30 hari terakhir</CardDescription></CardHeader>
        <CardContent><div className="space-y-2">{archiveActivities.slice(0, 8).map((activity) => <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/20 bg-background/30"><div className="mt-0.5">{activity.activityType === 'file_uploaded' && <FileUp className="size-4 text-emerald-500" />}{activity.activityType === 'document_updated' && <Edit2 className="size-4 text-blue-500" />}{activity.activityType === 'file_downloaded' && <Download className="size-4 text-cyan-500" />}{activity.activityType === 'export_generated' && <Share2 className="size-4 text-amber-500" />}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium">{activity.activityType === 'file_uploaded' && `File uploaded: ${activity.fileName}`}{activity.activityType === 'document_updated' && `Document updated: ${activity.fileName}`}{activity.activityType === 'file_downloaded' && `File downloaded: ${activity.fileName}`}{activity.activityType === 'export_generated' && `Export generated: ${activity.fileName}`}</p><p className="text-xs text-muted-foreground mt-1">{activity.userName} • {new Date(activity.timestamp).toLocaleString('id-ID')}</p></div></div>)}</div></CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
          {selectedFile && <><div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4"><SheetHeader className="pb-0"><SheetTitle className="text-xl">{selectedFile.name}</SheetTitle><SheetDescription>Archive file details</SheetDescription></SheetHeader></div><div className="flex-1 overflow-y-auto"><div className="space-y-6 px-6 py-6"><div className="bg-muted p-6 rounded-lg border border-border/30 text-center"><div className="text-6xl mb-4">{getFileIcon(selectedFile.fileType)}</div><p className="text-sm text-muted-foreground">{selectedFile.fileType.toUpperCase()}</p><p className="text-xs text-muted-foreground mt-1">{getFileSizeDisplay(selectedFile.fileSize)}</p></div><div><h3 className="font-semibold text-sm mb-3">File Information</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">File Name:</span><span className="font-medium">{selectedFile.name}</span></div><div className="flex justify-between"><span className="text-muted-foreground">File Type:</span><span className="font-medium uppercase">{selectedFile.fileType}</span></div><div className="flex justify-between"><span className="text-muted-foreground">File Size:</span><span className="font-medium">{getFileSizeDisplay(selectedFile.fileSize)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Status:</span><Badge className={cn(selectedFile.status === 'active' && 'bg-emerald-500/20 text-emerald-600', selectedFile.status === 'archived' && 'bg-amber-500/20 text-amber-600', selectedFile.status === 'deleted' && 'bg-red-500/20 text-red-600')}>{selectedFile.status}</Badge></div></div></div><div><h3 className="font-semibold text-sm mb-3">Category & Metadata</h3><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Category:</span><Badge variant="outline">{getCategoryLabel(selectedFile.category)}</Badge></div><div className="flex justify-between"><span className="text-muted-foreground">Uploaded By:</span><span className="font-medium">{selectedFile.uploadedBy}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Upload Date:</span><span className="font-medium">{new Date(selectedFile.uploadDate).toLocaleString('id-ID')}</span></div></div></div>{selectedFile.tags.length > 0 && <div><h3 className="font-semibold text-sm mb-3">Tags</h3><div className="flex gap-2 flex-wrap">{selectedFile.tags.map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}</div></div>}{selectedFile.description && <div><h3 className="font-semibold text-sm mb-3">Description</h3><p className="text-sm text-muted-foreground">{selectedFile.description}</p></div>}</div></div><div className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-6 px-6 -mx-6 flex gap-2 border-t border-border/50"><Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Close</Button><Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleDownload(selectedFile.name)}><Download className="size-4" />Download</Button></div></>}
        </SheetContent>
      </Sheet>

      <Sheet open={folderOpen} onOpenChange={setFolderOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Kategori Baru</SheetTitle><SheetDescription>Buat kategori lokal untuk membantu pengelompokan arsip.</SheetDescription></SheetHeader>
          <div className="mt-6 space-y-4"><Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Misal: Dokumen Program 2026" /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setFolderOpen(false)}>Batal</Button><Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateCategory}>Simpan</Button></div></div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
