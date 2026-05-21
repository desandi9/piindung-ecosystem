'use client'

import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { 
  Shield,
  Plus,
  Users,
  Crown,
  Building2,
  GitBranch,
  User,
  Edit,
  Trash2,
  Eye,
  LayoutDashboard,
  Coins,
  MapPin,
  FileText,
  MessageSquare,
  Settings,
  Database,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { type GorutRoleConfig, useGorutRoleConfigs, writeGorutRoleConfigs } from '@/lib/gorut/access-control'

const menuPermissions = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'munfiq', label: 'Data Munfiq', icon: Users },
  { id: 'transaksi', label: 'Transaksi', icon: Coins },
  { id: 'keuangan', label: 'Keuangan', icon: Coins },
  { id: 'wilayah', label: 'Wilayah', icon: MapPin },
  { id: 'laporan', label: 'Laporan', icon: FileText },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'sistem', label: 'Sistem', icon: Settings },
  { id: 'backup', label: 'Backup', icon: Database },
]

const featurePermissions = [
  { id: 'create', label: 'Tambah Data' },
  { id: 'edit', label: 'Edit Data' },
  { id: 'delete', label: 'Hapus Data' },
  { id: 'export', label: 'Export Data' },
  { id: 'import', label: 'Import Data' },
  { id: 'validate', label: 'Validasi Setoran' },
]

export default function AksesPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const roleConfigs = useGorutRoleConfigs()
  const [draftRoles, setDraftRoles] = useState<GorutRoleConfig[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>('super_admin')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraftRoles(roleConfigs)
  }, [roleConfigs])

  const selectedRole = useMemo(
    () => draftRoles.find((role) => role.id === selectedRoleId) ?? draftRoles[0],
    [draftRoles, selectedRoleId]
  )

  const iconMap = {
    crown: Crown,
    building: Building2,
    branch: GitBranch,
    user: User,
  } as const

  const updateRolePermissions = (roleId: string, updater: (permissions: string[]) => string[]) => {
    setDraftRoles((currentRoles) => currentRoles.map((role) => {
      if (role.id !== roleId) return role
      return { ...role, permissions: updater(role.permissions) }
    }))
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    setIsSaving(true)
    try {
      await writeGorutRoleConfigs(draftRoles)
      toast({ variant: 'default', title: 'Hak akses disimpan', description: `Perubahan role ${selectedRole.nama} berhasil disimpan.` })
    } catch {
      toast({ variant: 'destructive', title: 'Gagal menyimpan', description: 'Konfigurasi hak akses belum berhasil disimpan.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddRole = () => {
    toast({ variant: 'default', title: 'Tambah role belum dibuka', description: 'Saat ini fokus pada pengelolaan role bawaan yang sudah ada.' })
  }

  const handleEditRole = () => {
    toast({ variant: 'default', title: 'Edit role', description: `Konfigurasi ${selectedRole?.nama ?? 'role'} bisa langsung diubah dari panel permission.` })
  }

  const handleDeleteRole = () => {
    toast({ variant: 'destructive', title: 'Role tidak dihapus', description: 'Penghapusan role masih dinonaktifkan untuk mencegah kehilangan konfigurasi inti.' })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hak Akses</h1>
          <p className="text-sm text-muted-foreground">Kelola role dan permissions pengguna</p>
        </div>
        <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleAddRole}>
          <Plus className="size-4" />
          Tambah Role
        </Button>
      </div>

      {/* Roles Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {draftRoles.map((role) => {
          const RoleIcon = iconMap[role.iconKey]
          return (
          <Card 
            key={role.id} 
            className={cn(
              'border cursor-pointer transition-all hover:shadow-md',
              selectedRole?.id === role.id ? 'ring-2 ring-emerald-500 shadow-md' : 'border-border/50'
            )}
            onClick={() => setSelectedRoleId(role.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex size-10 items-center justify-center rounded-lg border', role.color)}>
                  <RoleIcon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{role.nama}</p>
                  <p className="text-xs text-muted-foreground">{role.jumlahUser} pengguna</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {/* Role Detail */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Role Info */}
        <Card className="border-0 bg-card shadow-sm lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-3">
                <div className={cn('flex size-12 items-center justify-center rounded-xl border', selectedRole?.color)}>
                  {selectedRole ? (() => {
                    const RoleIcon = iconMap[selectedRole.iconKey]
                    return <RoleIcon className="size-6" />
                  })() : null}
                </div>
                <div>
                  <CardTitle className="text-lg">{selectedRole?.nama ?? '-'}</CardTitle>
                  <CardDescription>{selectedRole?.deskripsi ?? '-'}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Jumlah Pengguna</span>
                <Badge variant="secondary">{selectedRole?.jumlahUser ?? 0}</Badge>
              </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge className="bg-emerald-500/10 text-emerald-600">Aktif</Badge>
            </div>
            <div className="pt-4 border-t border-border/50 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleEditRole} disabled={!selectedRole}>
                <Edit className="size-4" />
                Edit
              </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-600 hover:bg-red-50" onClick={handleDeleteRole} disabled={!selectedRole}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="border-0 bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pengaturan Permissions</CardTitle>
            <CardDescription>Atur akses menu dan fitur untuk role {selectedRole?.nama ?? '-'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Menu Access */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Akses Menu</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {menuPermissions.map((menu) => {
                  const hasAccess = selectedRole?.permissions.includes('all') || 
                    selectedRole?.permissions.some(p => p === menu.id || p.startsWith(menu.id))
                  return (
                    <div 
                      key={menu.id} 
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-3 transition-colors',
                        hasAccess ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/50 opacity-50'
                      )}
                    >
                      <menu.icon className={cn('size-4', hasAccess ? 'text-emerald-600' : 'text-muted-foreground')} />
                      <span className="text-sm font-medium">{menu.label}</span>
                      <div className="ml-auto">
                        <Switch
                          checked={Boolean(hasAccess)}
                          disabled={selectedRole?.id === 'super_admin' || !selectedRole}
                          onCheckedChange={(checked) => {
                            if (!selectedRole || selectedRole.id === 'super_admin') return
                            updateRolePermissions(selectedRole.id, (permissions) => {
                              if (checked) return Array.from(new Set([...permissions, menu.id]))
                              return permissions.filter((permission) => permission !== menu.id && !permission.startsWith(`${menu.id}.`))
                            })
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Feature Permissions */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Akses Fitur</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {featurePermissions.map((feature) => {
                  const hasAccess = selectedRole?.permissions.includes('all') || 
                    selectedRole?.permissions.includes(feature.id)
                  return (
                    <div key={feature.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={feature.id} 
                        checked={Boolean(hasAccess)}
                        disabled={selectedRole?.id === 'super_admin' || !selectedRole}
                        onCheckedChange={(checked) => {
                          if (!selectedRole || selectedRole.id === 'super_admin') return
                          updateRolePermissions(selectedRole.id, (permissions) => {
                            if (checked) return Array.from(new Set([...permissions, feature.id]))
                            return permissions.filter((permission) => permission !== feature.id)
                          })
                        }}
                      />
                      <label
                        htmlFor={feature.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {feature.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Region Based Access */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Akses Wilayah</h4>
              <div className="rounded-lg border border-border/50 p-4">
                {selectedRole?.id === 'super_admin' || selectedRole?.id === 'pc_admin' ? (
                  <p className="text-sm text-muted-foreground">
                    Role ini memiliki akses ke <span className="font-medium text-foreground">semua wilayah</span>
                  </p>
                ) : selectedRole?.id === 'upzis_admin' ? (
                  <p className="text-sm text-muted-foreground">
                    Akses terbatas pada <span className="font-medium text-foreground">UPZIS yang ditugaskan</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Akses terbatas pada <span className="font-medium text-foreground">Ranting/Wilayah yang ditugaskan</span>
                  </p>
                )}
              </div>
            </div>

            {selectedRole?.id !== 'super_admin' && selectedRole && (
              <div className="flex justify-end pt-4 border-t border-border/50">
                 <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSavePermissions} disabled={isSaving || user?.role !== 'super_admin_pc'}>
                   {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                 </Button>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
