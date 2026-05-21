// GORUT - Gerakan Koin Infak Nahdlaul Ulama Garut
// Type definitions for the GORUT module

export interface KotakInfaq {
  id: string
  kodeKotak: string
  namaLokasi: string
  alamat: string
  kecamatan: string
  desa: string
  penanggungJawab: string
  noHp: string
  status: 'aktif' | 'nonaktif' | 'pending'
  totalCollected?: number
  lastCollection?: string
  createdAt: string
}

export interface PengumpulanKoin {
  id: string
  kotakId: string
  nominal: number
  tanggal: string
  petugas: string
  metodePengumpulan: 'scan' | 'manual'
  keterangan?: string

  // Fields referenced by search UI (optional for backwards compatibility)
  nama?: string
  kecamatan?: string
  statusSetoran?: string
  totalSetoran?: number
}

export interface KecamatanData {
  id: string
  nama: string

  jumlahKotak: number
  jumlahKotakAktif: number
  totalTerkumpul: number
  jumlahDesa: number

  // Fields referenced by UI/search (optional to avoid breaking older datasets)
  rantingCount?: number
  munfiqCount?: number
  totalKoin?: number

  totalKotak?: number
  totalSetoran?: number
}

export interface StatistikGorut {
  totalKotak: number
  kotakAktif: number
  kotakNonaktif: number
  kotakPending: number
  totalTerkumpul: number
  terkumpulBulanIni: number
  totalKecamatan: number
  totalDesa: number
  pertumbuhan: number
}

export interface Activity {
  id: string
  type: 'setoran' | 'validasi' | 'kotak_baru' | 'admin'
  title: string
  description: string
  timestamp: string
  user: string
  metadata?: Record<string, unknown>
}

export interface MunfiqData {
  id: string
  munfiqCode?: string
  nama: string
  nik: string
  alamat: string
  kecamatan: string
  desa: string
  noHp: string
  tglLahir?: string
  jenisKelamin?: 'pria' | 'wanita'
  totalSetoran: number
  jumlahSetoran: number
  lastSetoran?: string
  status: 'aktif' | 'nonaktif'
  plpk: string
  plpkCode?: string
  sequence?: number
  tglRegistrasi?: string
}

export interface SetoranKoin {
  id: string
  munfiqId: string
  kotakId: string
  nominal: number
  tanggal: string
  validasi: 'pending' | 'valid' | 'invalid'
  validator?: string
  validatedAt?: string
}

export interface Transaction {
  id: string
  kode: string
  tanggal: string
  munfiqNama: string
  munfiqId: string
  nominal: number
  metodePembayaran: 'tunai' | 'transfer' | 'qris'
  validator?: string
  status: 'pending' | 'valid' | 'invalid'
  buktiPembayaran?: string
  kecamatan: string
}

export interface PLPKData {
  id: string
  nama: string
  noHp: string
  kecamatan: string
  ranting: string
  jumlahMunfiq: number
  targetMunfiq: number
  totalSetoran: number
  targetSetoran: number
  status: 'aktif' | 'nonaktif'
  performanceScore: number
  lastActivity?: string
}

export interface WhatsAppTemplate {
  id: string
  nama: string
  tipe: 'setoran_berhasil' | 'validasi' | 'reminder' | 'broadcast'
  konten: string
  variabel: string[]
  aktif: boolean
  updatedAt: string
}

export interface BackupData {
  id: string
  nama: string
  tanggal: string
  ukuran: string
  tipe: 'manual' | 'otomatis'
  status: 'berhasil' | 'gagal' | 'proses'
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  detail: string
  timestamp: string
  ipAddress: string
  browser: string
  device: string
}

export interface FinanceStats {
  totalPendapatan: number
  saldoSekarang: number
  pendapatanBulanIni: number
  pertumbuhanPendapatan: number
  totalTransaksi: number
  rataRataTransaksi: number
}

// Approval Workflow Types
export type ApprovalStep = 'plpk' | 'ranting' | 'upzis' | 'pc'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalAction {
  step: ApprovalStep
  status: ApprovalStatus
  validator: string
  validatorRole: string
  timestamp: string
  notes?: string
}

export interface ApprovalTransaction {
  id: string
  kode: string
  tanggal: string
  munfiqNama: string
  munfiqId: string
  nominal: number
  metodePembayaran: 'tunai' | 'transfer' | 'qris'
  kecamatan: string
  ranting: string
  currentStep: ApprovalStep
  overallStatus: ApprovalStatus
  approvalHistory: ApprovalAction[]
  buktiPembayaran?: string

  // Fields referenced by search UI (optional)
  transactionId?: string
  amount?: number
  status?: string
  submittedAt?: string
}

// Notification Types
export type NotificationCategory =
  | 'pending_approval'
  | 'pending_validation' // used by notifikasi UI
  | 'target_achievement'
  | 'plpk_inactive'
  | 'failed_transaction'
  | 'backup_status'
  | 'whatsapp_gateway'
  | 'whatsapp_status' // used by notifikasi UI
  | 'monthly_report'
  | 'suspicious_login'
  | 'storage_warning'
  | 'successful_validation'
  | 'rejected_transaction'
  | 'user_activity'

export type NotificationPriority =
  | 'info'
  | 'success'
  | 'warning'
  | 'critical'
  | 'urgent' // used by notifikasi UI
  | 'high' // used by notifikasi UI
  | 'medium' // used by notifikasi UI
  | 'low' // used by notifikasi UI

export interface Notification {
  id: string
  title: string
  message: string
  category: NotificationCategory
  priority: NotificationPriority
  isRead: boolean
  isPinned?: boolean
  timestamp: string
  actionUrl?: string
  actionLabel?: string
  icon?: string
  metadata?: Record<string, unknown>
}

// Announcement Types
export type AnnouncementStatus = 'draft' | 'published' | 'scheduled' | 'archived'
export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent'
export type AnnouncementCategory = 'system' | 'operasional' | 'keuangan' | 'event' | 'maintenance'
export type AudienceType = 'all_admins' | 'admin_pc' | 'upzis' | 'ranting' | 'plpk' | 'mobile_app_users'

export interface Announcement {
  id: string
  title: string
  content: string
  category: AnnouncementCategory
  priority: AnnouncementPriority
  audience: AudienceType[]
  status: AnnouncementStatus
  isPinned: boolean
  createdBy: string
  createdAt: string
  publishedAt?: string
  scheduledAt?: string
  archivedAt?: string
}

// Target & Performance Types
export type PerformanceStatus = 'achieved' | 'on_track' | 'warning' | 'below_target'

export interface MonthlyTarget {
  id: string
  bulan: string
  targetAmount: number
  currentAmount: number
  achievementPercentage: number
  status: PerformanceStatus
}

export interface KecamatanTarget {
  id: string
  kecamatanId: string
  kecamatanNama: string
  bulan: string
  targetAmount: number
  currentAmount: number
  achievementPercentage: number
  ranking: number
  status: PerformanceStatus
}

export interface PLPKTarget {
  id: string
  plpkId: string
  plpkNama: string
  kecamatan: string
  bulan: string
  targetAmount: number
  currentAmount: number
  achievementPercentage: number
  ranking: number
  status: PerformanceStatus
}

// Audit Types
export type AuditActivityType =
  | 'login'
  | 'data_change'
  | 'permission_change'
  | 'deletion'
  | 'export'
  | 'failed_login'
  | 'access'
  | 'configuration'
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AuditStatus = 'success' | 'warning' | 'failed' | 'suspicious'

export interface AuditLog {
  id: string
  timestamp: string
  activityType: AuditActivityType
  userName: string
  module: string
  details: string
  oldValue?: string
  newValue?: string
  ipAddress: string
  deviceBrowser: string
  severity: AuditSeverity
  status: AuditStatus
  location?: string
  archived?: boolean
}

// Digital Archive Types
export type ArchiveCategory =
  | 'financial_reports'
  | 'monthly_reports'
  | 'meeting_minutes'
  | 'berita_acara'
  | 'export_files'
  | 'templates'
  | 'legal_documents'
  | 'internal_documents'
export type ArchiveStatus = 'active' | 'archived' | 'deleted'

export interface ArchiveFile {
  id: string
  name: string
  category: ArchiveCategory
  uploadDate: string
  uploadedBy: string
  fileSize: number
  fileType: string
  status: ArchiveStatus
  tags: string[]
  description?: string
  preview?: string
}

export interface ArchiveActivity {
  id: string
  timestamp: string
  activityType:
    | 'file_uploaded'
    | 'document_updated'
    | 'archive_moved'
    | 'file_downloaded'
    | 'category_created'
    | 'export_generated'
  fileName: string
  userName: string
  category?: ArchiveCategory
}
