'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getGorutActiveItemKey, getGorutNavGroupsForRole, isGorutPathActive } from '@/lib/gorut/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGorutValidasiRows } from '@/lib/gorut/validasi-control'
import { useGorutPenghimpunanVerificationState } from '@/lib/gorut/penghimpunan-control'
import { kordesUpzisRows, plpkKordesRows, upzisPcRows } from '@/lib/gorut/penghimpunan-dummy'

interface GorutSidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function GorutSidebar({ collapsed = false, onCollapsedChange }: GorutSidebarProps) {
  const { user } = useAuth()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const activeItemKey = getGorutActiveItemKey(pathname, user?.role)
  const validasiRows = useGorutValidasiRows()
  const verificationState = useGorutPenghimpunanVerificationState()

  const pendingPenghimpunanCount =
    plpkKordesRows.filter((item) => !verificationState.plpkKordesVerifiedIds.includes(item.id)).length +
    kordesUpzisRows.filter((item) => !verificationState.kordesUpzisVerifiedIds.includes(item.id)).length +
    upzisPcRows.filter((item) => !verificationState.upzisPcVerifiedIds.includes(item.id)).length

  const pendingValidasiCount = validasiRows.filter((item) => item.validasi === 'pending').length

  const navGroups = getGorutNavGroupsForRole(user?.role).map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.title === 'Penghimpunan') {
        return { ...item, badge: pendingPenghimpunanCount || undefined }
      }

      if (item.title === 'Verifikasi Penghimpunan' || item.title === 'Verifikasi') {
        return { ...item, badge: pendingValidasiCount || undefined }
      }

      if (item.title === 'Rekapitulasi') {
        return { ...item, badge: upzisPcRows.filter((row) => !verificationState.upzisPcVerifiedIds.includes(row.id)).length || undefined }
      }

      return item
    }),
  }))

  const handleCollapse = (value: boolean) => {
    if (value !== collapsed) {
      onCollapsedChange?.(value)
    }
  }

  useEffect(() => {
    if (collapsed) return

    for (const group of navGroups) {
      for (const item of group.items) {
        const hasActiveSubmenu = item.submenu?.some((subitem) => isGorutPathActive(pathname, subitem.href))
        if (hasActiveSubmenu) {
          setExpandedItems((current) => {
            if (current.has(item.title)) return current
            const next = new Set(current)
            next.add(item.title)
            return next
          })
          return
        }
      }
    }
  }, [collapsed, navGroups, pathname])

  const toggleExpandItem = (title: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(title)) {
      newExpanded.delete(title)
    } else {
      newExpanded.add(title)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <TooltipProvider delayDuration={0}>
        <aside
          className={cn(
          'fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-border/50 bg-card/95 backdrop-blur-sm transition-all duration-300 ease-in-out lg:flex lg:flex-col',
           collapsed ? 'w-[72px]' : 'w-[280px]'
          )}
        >
        {/* Header with Logo */}
        <div className={cn(
          'flex h-20 items-center justify-between gap-2 border-b border-border/50 px-3 py-3',
          !collapsed && 'px-4'
        )}>
          {!collapsed ? (
            <Link href="/gorut" className="group flex min-w-0 flex-1 items-center gap-3">
              <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/gorut-logo-icon.png"
                  alt="GORUT"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-emerald-300">GORUT</span>
                <span className="text-[11px] text-muted-foreground font-medium truncate">Koin Infak NU</span>
              </div>
            </Link>
          ) : (
            <Link href="/gorut" className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-transform hover:scale-105" title="GORUT">
              <Image
                src="/gorut-logo-icon.png"
                alt="GORUT"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="z-10 size-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => handleCollapse(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        {/* Back to PIINDUNG */}
        <div className={cn('border-b border-border/50 px-3 py-3', collapsed && 'flex justify-center')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
                  collapsed && 'w-10 justify-center px-0'
                )}
              >
                <ArrowLeft className="size-4 shrink-0" />
                {!collapsed && <span className="font-medium">Kembali ke PIINDUNG</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Kembali ke PIINDUNG</TooltipContent>}
          </Tooltip>
        </div>

        {/* Navigation Groups */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.title}>
                <div className={cn('mb-2', !collapsed && 'px-3')}>
                  {!collapsed && (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                      {group.title}
                    </span>
                  )}
                  {collapsed && <div className="h-px bg-border/50 mx-2" />}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const itemKey = `${group.title}:${item.title}`
                    const isActive = activeItemKey === itemKey || (item.submenu?.some((subitem) => isGorutPathActive(pathname, subitem.href)) ?? false)
                    const isExpanded = expandedItems.has(item.title)
                    const hasSubmenu = item.submenu && item.submenu.length > 0
                    
                    return (
                      <div key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {hasSubmenu && !collapsed ? (
                              <button
                                type="button"
                                onClick={() => toggleExpandItem(item.title)}
                                className={cn(
                                  'group relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-left',
                                  isActive
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                  collapsed && 'justify-center px-0'
                                )}
                              >
                                {isActive && (
                                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                                )}
                                <item.icon className={cn(
                                  'size-5 shrink-0 transition-colors',
                                  isActive && 'text-emerald-500'
                                )} />
                                {!collapsed && (
                                  <>
                                    <span className="flex-1">{item.title}</span>
                                    {item.badge && (
                                      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        {item.badge}
                                      </span>
                                    )}
                                    {hasSubmenu && (
                                      <ChevronRight className={cn(
                                        'size-4 transition-transform duration-200',
                                        isExpanded && 'rotate-90'
                                      )} />
                                    )}
                                  </>
                                )}
                                {collapsed && item.badge && (
                                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                                    {item.badge > 9 ? '9+' : item.badge}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <Link
                                href={item.href}
                                className={cn(
                                  'group relative w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-left',
                                  isActive
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                  collapsed && 'justify-center px-0'
                                )}
                              >
                                {isActive && (
                                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                                )}
                                <item.icon className={cn(
                                  'size-5 shrink-0 transition-colors',
                                  isActive && 'text-emerald-500'
                                )} />
                                {!collapsed && (
                                  <>
                                    <span className="flex-1">{item.title}</span>
                                    {item.badge && (
                                      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        {item.badge}
                                      </span>
                                    )}
                                    {hasSubmenu && (
                                      <ChevronRight className={cn(
                                        'size-4 transition-transform duration-200',
                                        isExpanded && 'rotate-90'
                                      )} />
                                    )}
                                  </>
                                )}
                                {collapsed && item.badge && (
                                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                                    {item.badge > 9 ? '9+' : item.badge}
                                  </span>
                                )}
                              </Link>
                            )}
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right" className="flex items-center gap-2">
                              {item.title}
                              {item.badge && (
                                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                                  {item.badge}
                                </span>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>

                        {/* Submenu */}
                        {hasSubmenu && isExpanded && !collapsed && (
                          <div className="ml-2 space-y-1 border-l border-border/30 pl-3 py-1">
                            {item.submenu?.map((subitem) => (
                              <Link
                                key={subitem.href}
                                href={subitem.href}
                                className={cn(
                                  'block rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200',
                                  isGorutPathActive(pathname, subitem.href)
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                              >
                                {subitem.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn('border-t border-border/50 p-3', collapsed && 'flex flex-col items-center gap-2')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/gorut/help"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
                  collapsed && 'w-10 justify-center px-0'
                )}
              >
                <HelpCircle className="size-4 shrink-0" />
                {!collapsed && <span>Bantuan</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Bantuan</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
