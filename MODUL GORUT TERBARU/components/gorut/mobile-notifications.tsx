// Push Notification Management Components
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Send,
  Bell,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PushNotificationTemplate, PushCategory } from '@/lib/gorut/mobile-types'

const CATEGORY_COLORS: Record<PushCategory, string> = {
  Operational: 'bg-blue-500/10 text-blue-700',
  Finance: 'bg-emerald-500/10 text-emerald-700',
  Reminder: 'bg-amber-500/10 text-amber-700',
  Announcement: 'bg-purple-500/10 text-purple-700',
  Security: 'bg-red-500/10 text-red-700',
}

export function PushTemplateCard({
  template,
  onSendTest,
}: {
  template: PushNotificationTemplate
  onSendTest: (id: string) => void
}) {
  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Bell className="w-5 h-5 text-foreground/60" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{template.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{template.title}</p>
          </div>
        </div>
        <Badge className={cn('text-xs', CATEGORY_COLORS[template.category])}>
          {template.category}
        </Badge>
      </div>

      <div className="bg-muted/50 rounded p-3 mb-4">
        <p className="text-xs text-muted-foreground">Preview</p>
        <p className="text-sm font-medium mt-1 line-clamp-2">{template.body}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span>Created: {template.createdAt.toLocaleDateString()}</span>
        {template.deepLink && <span className="text-emerald-600">Link included</span>}
      </div>

      <Button
        size="sm"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
        onClick={() => onSendTest(template.id)}
      >
        <Send className="w-3 h-3 mr-1" />
        Send Test Notification
      </Button>
    </div>
  )
}

export function PushTemplatesGrid({
  templates,
  onSendTest,
}: {
  templates: PushNotificationTemplate[]
  onSendTest: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <PushTemplateCard
          key={template.id}
          template={template}
          onSendTest={onSendTest}
        />
      ))}
    </div>
  )
}

export function NotificationAudienceCard({
  name,
  filters,
  count,
  isSelected,
  onSelect,
}: {
  name: string
  filters: any
  count: number
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={cn(
        'border border-border rounded-lg p-4 cursor-pointer transition-colors',
        isSelected && 'bg-emerald-500/10 border-emerald-500'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Users className="w-3.5 h-3.5" />
            <span>{count} users</span>
          </div>
        </div>
        {isSelected && (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        {filters.appType && (
          <p>App: {filters.appType}</p>
        )}
        {filters.roles && (
          <p>Roles: {filters.roles.join(', ')}</p>
        )}
        {filters.regions && (
          <p>Regions: {filters.regions.join(', ')}</p>
        )}
      </div>
    </div>
  )
}

export function NotificationTestDialog({
  templateId,
  audienceCount,
  onSend,
  onCancel,
}: {
  templateId: string
  audienceCount: number
  onSend: () => void
  onCancel: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'sending' | 'success' | null>(null)

  const handleSend = async () => {
    setIsLoading(true)
    setStatus('sending')
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setStatus('success')
    setIsLoading(false)
    setTimeout(() => {
      onSend()
    }, 1000)
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-muted/30 max-w-md">
      <h3 className="font-semibold mb-4">Send Test Notification</h3>

      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-muted rounded">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{audienceCount} users will receive</span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted rounded">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">Sent at: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {status === 'success' && (
        <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500 rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-emerald-700">Notification sent successfully!</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 text-xs"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          disabled={isLoading || status === 'success'}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
        >
          {isLoading ? 'Sending...' : 'Send Test'}
        </Button>
      </div>
    </div>
  )
}
