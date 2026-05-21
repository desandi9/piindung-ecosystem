'use client'

import { useState, ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  Edit,
  MoreVertical,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (selectedIds: string[]) => void
  variant?: 'default' | 'destructive' | 'secondary'
  show?: (selectedCount: number) => boolean
}

interface EnhancedTableProps {
  columns: Array<{
    id: string
    label: string
    sortable?: boolean
    width?: string
  }>
  rows: Array<{ id: string; [key: string]: ReactNode }>
  onRowClick?: (rowId: string) => void
  bulkActions?: TableAction[]
  rowHoverHighlight?: boolean
  selectable?: boolean
  emptyMessage?: string
}

export function EnhancedTable({
  columns,
  rows,
  onRowClick,
  bulkActions = [],
  rowHoverHighlight = true,
  selectable = false,
  emptyMessage = 'No data available',
}: EnhancedTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const toggleRowSelection = (rowId: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId)
    } else {
      newSelected.add(rowId)
    }
    setSelectedRows(newSelected)
  }

  const toggleAllRows = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(rows.map(r => r.id)))
    }
  }

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  const visibleBulkActions = bulkActions.filter(
    action => !action.show || action.show(selectedRows.size)
  )

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {selectedRows.size > 0 && visibleBulkActions.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 animate-in fade-in slide-in-from-top">
          <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            {selectedRows.size} selected
          </span>
          <div className="flex-1" />
          <div className="flex gap-2">
            {visibleBulkActions.map(action => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant}
                onClick={() => {
                  action.onClick(Array.from(selectedRows))
                  setSelectedRows(new Set())
                }}
              >
                {action.icon && <action.icon className="size-4 mr-1.5" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {selectable && (
                <TableHead className="w-12 px-4">
                  <Checkbox
                    checked={
                      selectedRows.size === rows.length && rows.length > 0
                        ? true
                        : selectedRows.size > 0 && selectedRows.size < rows.length
                          ? 'indeterminate'
                          : false
                    }
                    onChange={toggleAllRows}
                  />
                </TableHead>
              )}
              {columns.map(column => (
                <TableHead
                  key={column.id}
                  className={cn(
                    'font-semibold',
                    column.width && `w-${column.width}`,
                    column.sortable && 'cursor-pointer hover:text-foreground transition-colors'
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.id && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow
                key={row.id}
                className={cn(
                  'transition-colors',
                  rowHoverHighlight && 'hover:bg-muted/50',
                  selectedRows.has(row.id) && 'bg-emerald-50 dark:bg-emerald-950/20'
                )}
                onClick={() => onRowClick?.(row.id)}
              >
                {selectable && (
                  <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                    />
                  </TableCell>
                )}
                {columns.map(column => (
                  <TableCell key={`${row.id}-${column.id}`} className="py-3">
                    {row[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Simple Pagination Component
export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  totalItems = 0,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  totalItems?: number
}) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <p className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} items
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1 px-3 py-2">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1
            if (pageNum > totalPages) return null
            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
