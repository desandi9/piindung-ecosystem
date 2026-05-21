'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Lock,
  Search,
  Download,
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Shield,
  AlertTriangle,
  Eye,
  Archive,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { AuditLog } from '@/lib/gorut/types'
import { refreshGorutAuditLogs, updateGorutAuditLog, useGorutAuditLogs } from '@/lib/gorut/audit-control'
import { cn } from '@/lib/utils'

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActivityTypeLabel(type: string) {
  const labels: Record<string, string> = {
    login: 'Login',
    data_change: 'Data Change',
    permission_change: 'Permission Change',
    deletion: 'Deletion',
    export: 'Export',
    failed_login: 'Failed Login',
    access: 'Access',
    configuration: 'Configuration',
  }
  return labels[type] || type
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'low':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
    case 'medium':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
    case 'high':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400'
    case 'critical':
      return 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
    default:
      return 'border-gray-500/30 bg-gray-500/10 text-gray-600'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="size-4 text-emerald-500" />
    case 'warning':
      return <AlertTriangle className="size-4 text-amber-500" />
    case 'failed':
      return <XCircle className="size-4 text-red-500" />
    case 'suspicious':
      return <AlertCircle className="size-4 text-red-600" />
    default:
      return <Clock className="size-4 text-gray-500" />
  }
}

function getActivityTypeIcon(type: string) {
  switch (type) {
    case 'login':
      return '🔓'
    case 'failed_login':
      return '🔒'
    case 'data_change':
      return '✏️'
    case 'permission_change':
      return '🛡️'
    case 'deletion':
      return '🗑️'
    case 'export':
      return '📥'
    case 'access':
      return '👁️'
    case 'configuration':
      return '⚙️'
    default:
      return '📋'
  }
}

export default function AuditCenterPage() {
  const { toast } = useToast()
  const auditLogs = useGorutAuditLogs()
  const [search, setSearch] = useState('')
  const [activityFilter, setActivityFilter] = useState('semua')
  const [severityFilter, setSeverityFilter] = useState('semua')
  const [userFilter, setUserFilter] = useState('semua')
  const [moduleFilter, setModuleFilter] = useState('semua')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Get unique values for filters
  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.userName)))
  const uniqueModules = Array.from(new Set(auditLogs.map(log => log.module)))

  // Filter logic
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (log.archived) return false
      const matchesSearch =
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.module.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.ipAddress.includes(search)

      const matchesActivity = activityFilter === 'semua' || log.activityType === activityFilter
      const matchesSeverity = severityFilter === 'semua' || log.severity === severityFilter
      const matchesUser = userFilter === 'semua' || log.userName === userFilter
      const matchesModule = moduleFilter === 'semua' || log.module === moduleFilter
      const matchesStatus = statusFilter === 'semua' || log.status === statusFilter

      return (
        matchesSearch &&
        matchesActivity &&
        matchesSeverity &&
        matchesUser &&
        matchesModule &&
        matchesStatus
      )
    })
  }, [search, activityFilter, severityFilter, userFilter, moduleFilter, statusFilter])

  // Calculate stats
  const totalLogs = auditLogs.length
  const criticalActivities = auditLogs.filter(log => log.severity === 'critical').length
  const failedLogins = auditLogs.filter(log => log.activityType === 'failed_login').length
  const dataChanges = auditLogs.filter(log => log.activityType === 'data_change').length
  const permissionChanges = auditLogs.filter(log => log.activityType === 'permission_change').length
  const deletedRecords = auditLogs.filter(log => log.activityType === 'deletion').length

  const recentSecurityEvents = auditLogs.filter(log =>
    ['failed_login', 'permission_change', 'deletion', 'suspicious'].includes(
      log.activityType === 'failed_login' ? 'failed_login' : log.status === 'suspicious' ? 'suspicious' : log.activityType
    )
  ).slice(0, 5)

  const handleResetFilters = () => {
    setSearch('')
    setActivityFilter('semua')
    setSeverityFilter('semua')
    setUserFilter('semua')
    setModuleFilter('semua')
    setStatusFilter('semua')
  }

  const handleRefresh = () => {
    void refreshGorutAuditLogs()
      .then(() => {
        toast({ variant: 'default', title: 'Audit log diperbarui', description: 'Data audit berhasil dimuat ulang.' })
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Gagal refresh audit log', description: 'Data audit belum berhasil dimuat ulang.' })
      })
  }

  const handleArchiveRecord = () => {
    if (!selectedAudit) return
    void updateGorutAuditLog(selectedAudit.id, { archived: true })
      .then(() => {
        toast({ variant: 'default', title: 'Audit record diarsipkan', description: `${selectedAudit.module} • ${selectedAudit.userName} ditandai untuk arsip internal.` })
        setDrawerOpen(false)
      })
      .catch(() => {
        toast({ variant: 'destructive', title: 'Gagal mengarsipkan record', description: 'Audit record belum berhasil dipindahkan ke arsip internal.' })
      })
  }

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Activity Type', 'User', 'Module', 'Details', 'Severity', 'Status', 'IP Address'],
      ...filteredLogs.map(log => [
        log.timestamp,
        getActivityTypeLabel(log.activityType),
        log.userName,
        log.module,
        log.details,
        log.severity,
        log.status,
        log.ipAddress,
      ]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Lock className="size-8 text-emerald-600" />
          Audit Center
        </h1>
        <p className="text-muted-foreground mt-1">Monitor system activities, security events, and data changes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Audit Logs</p>
              <p className="text-2xl font-bold">{totalLogs}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Critical Activities</p>
              <p className="text-2xl font-bold text-red-600">{criticalActivities}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Failed Logins</p>
              <p className="text-2xl font-bold text-red-500">{failedLogins}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Data Changes</p>
              <p className="text-2xl font-bold text-amber-600">{dataChanges}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Permission Changes</p>
              <p className="text-2xl font-bold text-orange-600">{permissionChanges}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Deleted Records</p>
              <p className="text-2xl font-bold text-red-600">{deletedRecords}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="size-5 text-red-500" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentSecurityEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:bg-background/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(event.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{event.details}</span>
                    <Badge variant="outline" className={cn('text-xs', getSeverityColor(event.severity))}>
                      {event.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{event.userName} • {formatDateTime(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Audit Logs</CardTitle>
          <CardDescription>Detailed audit trail of all system activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, module, IP, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>

            {/* Filter Row */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">All Activities</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="failed_login">Failed Login</SelectItem>
                  <SelectItem value="data_change">Data Change</SelectItem>
                  <SelectItem value="permission_change">Permission Change</SelectItem>
                  <SelectItem value="deletion">Deletion</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="configuration">Configuration</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">All Users</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">All Modules</SelectItem>
                  {uniqueModules.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="w-full"
              >
                <Filter className="size-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {totalLogs} records
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                    onClick={handleRefresh}
                >
                  <RefreshCw className="size-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                >
                  <Download className="size-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-background/50">
                  <TableHead className="font-semibold">Time</TableHead>
                  <TableHead className="font-semibold">Activity</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Module</TableHead>
                  <TableHead className="font-semibold">Details</TableHead>
                  <TableHead className="font-semibold">Severity</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-border/30 hover:bg-background/50">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <span>{getActivityTypeIcon(log.activityType)}</span>
                        <span>{getActivityTypeLabel(log.activityType)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{log.userName}</TableCell>
                    <TableCell className="text-sm">{log.module}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {log.details}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', getSeverityColor(log.severity))}>
                        {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          log.status === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
                          log.status === 'warning' && 'border-amber-500/30 bg-amber-500/10 text-amber-600',
                          log.status === 'failed' && 'border-red-500/30 bg-red-500/10 text-red-600',
                          log.status === 'suspicious' && 'border-red-600/30 bg-red-600/10 text-red-600',
                        )}
                      >
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAudit(log)
                          setDrawerOpen(true)
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No audit logs found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
          {selectedAudit && (
            <>
              <div className="sticky top-0 z-10 border-b border-border/50 bg-background p-6 pb-4">
                <SheetHeader className="pb-0">
                  <SheetTitle className="text-xl flex items-center gap-2">
                    <span>{getActivityTypeIcon(selectedAudit.activityType)}</span>
                    {getActivityTypeLabel(selectedAudit.activityType)}
                  </SheetTitle>
                  <SheetDescription>Detailed audit log information</SheetDescription>
                </SheetHeader>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6 px-6 py-6">
                  {/* Activity Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Activity Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Timestamp</p>
                        <p className="text-sm font-medium">{formatDateTime(selectedAudit.timestamp)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Activity Type</p>
                        <p className="text-sm font-medium">{getActivityTypeLabel(selectedAudit.activityType)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Severity</p>
                        <Badge
                          variant="outline"
                          className={cn('text-xs w-fit mt-1', getSeverityColor(selectedAudit.severity))}
                        >
                          {selectedAudit.severity.charAt(0).toUpperCase() + selectedAudit.severity.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs w-fit mt-1',
                            selectedAudit.status === 'success' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
                            selectedAudit.status === 'warning' && 'border-amber-500/30 bg-amber-500/10 text-amber-600',
                            selectedAudit.status === 'failed' && 'border-red-500/30 bg-red-500/10 text-red-600',
                            selectedAudit.status === 'suspicious' && 'border-red-600/30 bg-red-600/10 text-red-600',
                          )}
                        >
                          {selectedAudit.status.charAt(0).toUpperCase() + selectedAudit.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actor Information */}
                  <div className="space-y-3 border-t border-border/30 pt-4">
                    <h3 className="font-semibold text-sm">Actor Information</h3>
                    <div className="grid gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">User/Admin</p>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <User className="size-4 text-muted-foreground" />
                          {selectedAudit.userName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Module Information */}
                  <div className="space-y-3 border-t border-border/30 pt-4">
                    <h3 className="font-semibold text-sm">Module & Details</h3>
                    <div className="grid gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Module</p>
                        <p className="text-sm font-medium">{selectedAudit.module}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Details</p>
                        <p className="text-sm font-medium">{selectedAudit.details}</p>
                      </div>
                    </div>
                  </div>

                  {/* Data Changes */}
                  {selectedAudit.oldValue && selectedAudit.newValue && (
                    <div className="space-y-3 border-t border-border/30 pt-4">
                      <h3 className="font-semibold text-sm">Data Changes</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                          <p className="text-xs text-muted-foreground mb-1">Old Value</p>
                          <p className="text-sm font-mono text-sm line-clamp-3">{selectedAudit.oldValue}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                          <p className="text-xs text-muted-foreground mb-1">New Value</p>
                          <p className="text-sm font-mono text-sm line-clamp-3">{selectedAudit.newValue}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Device & IP Information */}
                  <div className="space-y-3 border-t border-border/30 pt-4">
                    <h3 className="font-semibold text-sm">Device & IP Information</h3>
                    <div className="grid gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">IP Address</p>
                        <p className="text-sm font-mono font-medium">{selectedAudit.ipAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Device/Browser</p>
                        <p className="text-sm font-medium">{selectedAudit.deviceBrowser}</p>
                      </div>
                      {selectedAudit.location && (
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-medium">{selectedAudit.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-4 pb-6 px-6 border-t border-border/50 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setDrawerOpen(false)}>
                  Close
                </Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleArchiveRecord}>
                  <Archive className="size-4 mr-2" />
                  Archive
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
