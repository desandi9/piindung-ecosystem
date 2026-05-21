'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Clock, Pin, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { searchGorut, groupSearchResults, getCategoryInfo, type SearchResult, type SearchResultType } from '@/lib/gorut/search'

interface SearchDropdownProps {
  isOpen: boolean
  onClose: () => void
}

const RECENT_SEARCHES = ['Ahmad Handoko', 'Laporan April 2026', 'Transaksi TXN-001', 'Approval Workflow']

export function SearchDropdown({ isOpen, onClose }: SearchDropdownProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES)
  const [filteredType, setFilteredType] = useState<string | null>(null)

  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchGorut(query, 50)
      setResults(searchResults)
    } else {
      setResults([])
    }
  }, [query])

  const grouped = groupSearchResults(results)
  const filteredResults = filteredType
    ? results.filter(r => r.type === filteredType)
    : results

  const activeCategories = Object.entries(grouped)
    .filter(([_, items]) => items.length > 0)
    .map(([type]) => type)

  const handleSearch = (text: string) => {
    setQuery(text)
    if (!recentSearches.includes(text)) {
      setRecentSearches(prev => [text, ...prev.slice(0, 3)])
    }
  }

  const handleClearSearch = () => {
    setQuery('')
    setFilteredType(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="absolute left-1/2 top-24 w-full max-w-2xl -translate-x-1/2 rounded-2xl bg-card shadow-2xl border border-border/50">
        {/* Search Input */}
        <div className="border-b border-border/50 p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              autoFocus
              placeholder="Cari Munfiq, Transaksi, Laporan, Arsip, Pengumuman..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-12 bg-muted/50 pl-10 pr-10 text-sm focus:bg-muted border-border/50"
              onClick={(e) => e.stopPropagation()}
            />
            {query && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          {activeCategories.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              <button
                onClick={() => setFilteredType(null)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all',
                  !filteredType
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                Semua ({results.length})
              </button>
              {activeCategories.map(type => {
                const searchType = type as SearchResultType
                const info = getCategoryInfo(searchType)
                const count = grouped[searchType].length
                return (
                  <button
                    key={searchType}
                    onClick={() => setFilteredType(searchType)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-all',
                      filteredType === type
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {info.icon} {info.label} ({count})
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Results or Empty State */}
        <div
          className="max-h-96 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {query.trim() && filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <Search className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Tidak ada hasil</p>
                <p className="text-xs text-muted-foreground mt-1">Coba cari dengan kata kunci lain</p>
              </div>
            </div>
          ) : query.trim() ? (
            <div className="divide-y divide-border/30">
              {filteredResults.slice(0, 15).map(result => {
                const info = getCategoryInfo(result.type)
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => {
                      if (result.link) window.location.href = result.link
                      onClose()
                    }}
                    className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-lg">{info.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <Badge variant="outline" className="text-xs shrink-0 bg-muted/50">
                            {info.label}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        )}
                        {result.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{result.description}</p>
                        )}
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-6 space-y-4">
              {/* Recent Searches */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="size-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pencarian Terbaru</p>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(search)}
                      className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all text-left group flex items-center justify-between"
                    >
                      {search}
                      <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Shortcuts */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Akses Cepat</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Data Munfiq', link: '/gorut/munfiq' },
                    { label: 'Approval Setoran', link: '/gorut/approval' },
                    { label: 'Laporan', link: '/gorut/laporan' },
                    { label: 'Arsip Digital', link: '/gorut/archive' },
                  ].map(item => (
                    <Link
                      key={item.label}
                      href={item.link}
                      onClick={onClose}
                      className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
          <p>Tekan <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">ESC</kbd> untuk menutup</p>
        </div>
      </div>
    </div>
  )
}
