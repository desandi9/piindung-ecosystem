// QR Member Card Components
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  QrCode,
  Download,
  Copy,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { QRMemberCard } from '@/lib/gorut/mobile-types'

export function QRMemberCardComponent({ member }: { member: QRMemberCard }) {
  const handleDownload = () => {
    // In a real app, this would download the QR code
    console.log('Downloading QR for', member.memberName)
  }

  const handleCopy = () => {
    // In a real app, this would copy member ID
    navigator.clipboard.writeText(member.memberId)
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:border-emerald-500/30 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-600/10 border-b border-border p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">{member.memberName}</h3>
            <p className="text-xs text-muted-foreground mt-1">{member.kecamatan}</p>
          </div>
          <Badge
            className={cn(
              'text-xs whitespace-nowrap',
              member.isActive
                ? 'bg-emerald-500/10 text-emerald-700'
                : 'bg-slate-500/10 text-slate-700'
            )}
          >
            {member.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{member.role}</p>
      </div>

      {/* QR Code Area */}
      <div className="p-4 bg-muted/30">
        <div className="bg-white rounded-lg p-4 flex items-center justify-center mb-4">
          <div className="w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded flex items-center justify-center">
            <QrCode className="w-12 h-12 text-slate-400" />
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground mb-3">
          Member ID: {member.memberId}
        </p>
      </div>

      {/* Details */}
      <div className="border-t border-border p-4 bg-muted/20 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Member Since</span>
          <span className="font-medium">
            {member.joinDate.toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Role</span>
          <span className="font-medium">{member.role}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border p-3 bg-muted/10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-8"
          onClick={handleDownload}
        >
          <Download className="w-3 h-3 mr-1" />
          Download
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-8"
          onClick={handleCopy}
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy ID
        </Button>
      </div>
    </div>
  )
}

export function QRMemberCardsGrid({
  members,
}: {
  members: QRMemberCard[]
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((member) => (
        <QRMemberCardComponent key={member.id} member={member} />
      ))}
    </div>
  )
}

export function QRScanReadyLayout() {
  return (
    <div className="max-w-md mx-auto border border-border rounded-lg overflow-hidden bg-white">
      {/* Device Frame */}
      <div className="bg-slate-900 p-3 rounded-t-lg">
        <div className="bg-white rounded p-8 aspect-square flex flex-col items-center justify-center">
          {/* QR Placeholder */}
          <div className="w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded flex items-center justify-center mb-4">
            <QrCode className="w-12 h-12 text-slate-400" />
          </div>

          {/* Scan Instructions */}
          <div className="text-center w-full mt-4 px-4 text-xs text-slate-600">
            <p className="font-medium mb-1">Position QR code here</p>
            <p className="text-slate-500">within camera frame</p>
          </div>

          {/* Corner Guides */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-emerald-500" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-emerald-500" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-emerald-500" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-emerald-500" />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-100 p-3 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Camera Ready</span>
        </div>
      </div>
    </div>
  )
}

export function MemberQRStatusCard({
  totalMembers,
  membersWithQR,
  scanCount,
}: {
  totalMembers: number
  membersWithQR: number
  scanCount: number
}) {
  const completionPercent = Math.round((membersWithQR / totalMembers) * 100)

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <QrCode className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">QR Member ID Status</h3>
          <p className="text-xs text-muted-foreground">Mobile scanning ready</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Coverage</span>
            <span className="text-sm font-medium">{completionPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {membersWithQR} of {totalMembers} members
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-semibold text-emerald-600">{scanCount}</p>
            <p className="text-xs text-muted-foreground">Scans this month</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-600">{membersWithQR}</p>
            <p className="text-xs text-muted-foreground">Ready to scan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
