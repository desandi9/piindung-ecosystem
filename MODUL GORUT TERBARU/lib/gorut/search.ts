import type {
  KecamatanData,
  AuditLog,
  ArchiveFile,
  Announcement,
} from './types'
import {
  munfiqDataList,
  transactionData,
  pengumpulanData,
  plpkData,
  kecamatanData,
  approvalTransactionData,
  announcementData,
  archiveFiles,
  auditLogs,
} from './data'

export type SearchResultType = 'munfiq' | 'transaction' | 'setoran' | 'approval' | 'plpk' | 'kecamatan' | 'upzis' | 'report' | 'archive' | 'announcement' | 'user'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  description?: string
  icon?: string
  link?: string
  highlight?: string
  metadata?: Record<string, unknown>
}

// Build searchable datasets
export function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = []

  // Munfiq data
  munfiqDataList.slice(0, 20).forEach(m => {
    results.push({
      id: m.id,
      type: 'munfiq',
      title: m.nama,
      subtitle: m.kecamatan,
      description: `${m.nik} • ${m.status}`,
      link: '/gorut/munfiq',
      metadata: { nik: m.nik, kecamatan: m.kecamatan, status: m.status },
    })
  })

  // Transactions
  transactionData.slice(0, 15).forEach((t, i) => {
    results.push({
      id: `txn-${i}`,
      type: 'transaction',
      title: t.munfiqNama,
      subtitle: `Rp ${t.nominal.toLocaleString('id-ID')} • ${t.metodePembayaran}`,
      description: `${t.tanggal} • ${t.status}`,
      link: '/gorut/setoran',
      metadata: { amount: t.nominal, status: t.status, kecamatan: t.kecamatan },
    })
  })

  // Pengumpulan (Setoran / PengumpulanKoin)
  pengumpulanData.slice(0, 10).forEach((p, i) => {
    results.push({
      id: `setoran-${i}`,
      type: 'setoran',
      title: p.petugas,
      subtitle: `Rp ${p.nominal.toLocaleString('id-ID')} • ${p.metodePengumpulan}`,
      description: `${p.tanggal}`,
      link: '/gorut/setoran',
      metadata: { amount: p.nominal, kotakId: p.kotakId, petugas: p.petugas },
    })
  })

  // Approval transactions
  approvalTransactionData.slice(0, 10).forEach(a => {
    results.push({
      id: a.id,
      type: 'approval',
      title: a.kode,
      subtitle: `Rp ${a.nominal.toLocaleString('id-ID')} • ${a.currentStep}`,
      description: `${a.tanggal} • ${a.overallStatus}`,
      link: '/gorut/approval',
      metadata: { amount: a.nominal, status: a.overallStatus, step: a.currentStep },
    })
  })

  // PLPK data
  plpkData.slice(0, 15).forEach(p => {
    results.push({
      id: `plpk-${p.id}`,
      type: 'plpk',
      title: p.nama,
      subtitle: p.kecamatan,
      description: `${p.ranting} • ${p.status}`,
      link: '/gorut/munfiq',
      metadata: { role: 'PLPK', ranting: p.ranting, status: p.status },
    })
  })

  // Kecamatan data
  kecamatanData.forEach(k => {
    results.push({
      id: k.id,
      type: 'kecamatan',
      title: k.nama,
      subtitle: `${k.jumlahKotak} Kotak`,
      description: `Rp ${k.totalTerkumpul.toLocaleString('id-ID')}`,
      link: '/gorut/kecamatan',
      metadata: { boxes: k.jumlahKotak, amount: k.totalTerkumpul },
    })
  })

  // Announcements
  announcementData.slice(0, 10).forEach(a => {
    results.push({
      id: a.id,
      type: 'announcement',
      title: a.title,
      subtitle: a.category,
      description: a.content.substring(0, 60) + '...',
      link: '/gorut/announcement',
      metadata: { status: a.status, priority: a.priority },
    })
  })

  // Archive files
  archiveFiles.slice(0, 15).forEach(f => {
    results.push({
      id: f.id,
      type: 'archive',
      title: f.name,
      subtitle: f.category,
      description: `${f.fileSize}MB • ${f.uploadDate}`,
      link: '/gorut/archive',
      metadata: { size: f.fileSize, category: f.category },
    })
  })

  return results
}

// Perform search with keyword matching
export function searchGorut(query: string, limit: number = 20): SearchResult[] {
  if (!query.trim()) return []

  const index = buildSearchIndex()
  const q = query.toLowerCase()

  return index
    .filter(result => {
      const searchText = `${result.title} ${result.subtitle} ${result.description}`.toLowerCase()
      return searchText.includes(q)
    })
    .slice(0, limit)
}

// Group search results by type
export function groupSearchResults(results: SearchResult[]): Record<SearchResultType, SearchResult[]> {
  const grouped: Record<SearchResultType, SearchResult[]> = {
    munfiq: [],
    transaction: [],
    setoran: [],
    approval: [],
    plpk: [],
    kecamatan: [],
    upzis: [],
    report: [],
    archive: [],
    announcement: [],
    user: [],
  }

  results.forEach(result => {
    if (grouped[result.type]) {
      grouped[result.type].push(result)
    }
  })

  return grouped
}

// Get category display info
export function getCategoryInfo(type: SearchResultType) {
  const map: Record<SearchResultType, { label: string; icon: string; color: string }> = {
    munfiq: { label: 'Munfiq', icon: '👤', color: 'text-emerald-600' },
    transaction: { label: 'Transaksi', icon: '💳', color: 'text-blue-600' },
    setoran: { label: 'Setoran', icon: '💰', color: 'text-green-600' },
    approval: { label: 'Approval', icon: '✓', color: 'text-violet-600' },
    plpk: { label: 'PLPK', icon: '👨‍💼', color: 'text-amber-600' },
    kecamatan: { label: 'Kecamatan', icon: '📍', color: 'text-red-600' },
    upzis: { label: 'UPZIS', icon: '🏢', color: 'text-indigo-600' },
    report: { label: 'Laporan', icon: '📊', color: 'text-pink-600' },
    archive: { label: 'Arsip', icon: '📁', color: 'text-cyan-600' },
    announcement: { label: 'Pengumuman', icon: '📢', color: 'text-yellow-600' },
    user: { label: 'User', icon: '👥', color: 'text-slate-600' },
  }
  return map[type]
}
