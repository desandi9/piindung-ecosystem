// Mobile Ecosystem Types and Interfaces
export type DeviceType = 'iOS' | 'Android' | 'Web'
export type DeviceStatus = 'active' | 'idle' | 'suspicious' | 'blocked'
export type MobileSession = {
  id: string
  deviceId: string
  deviceName: string
  deviceType: DeviceType
  lastLogin: Date
  appVersion: string
  status: DeviceStatus
  isTrusted: boolean
  isOnline: boolean
  ipAddress: string
  location: string
  batteryLevel?: number
}

export type MobileDevice = {
  id: string
  userId: string
  userName: string
  deviceName: string
  deviceType: DeviceType
  appVersion: string
  osVersion: string
  registeredDate: Date
  lastActive: Date
  status: DeviceStatus
  sessions: number
  isTrusted: boolean
}

export type PushNotificationTemplate = {
  id: string
  name: string
  category: PushCategory
  title: string
  body: string
  icon?: string
  deepLink?: string
  createdAt: Date
}

export type PushCategory = 'Operational' | 'Finance' | 'Reminder' | 'Announcement' | 'Security'

export type NotificationAudience = {
  id: string
  name: string
  filters: {
    appType?: 'PLPK' | 'Munfiq' | 'Both'
    regions?: string[]
    roles?: string[]
    activeOnly?: boolean
  }
  count: number
}

export type DeviceActivityLog = {
  id: string
  deviceId: string
  action: 'login' | 'logout' | 'sync' | 'error' | 'warning'
  timestamp: Date
  details: string
}

export type MobileAppStatus = {
  activeUsers: number
  totalDevices: number
  onlineDevices: number
  avgBattery: number
  notificationDeliveryRate: number
  errorRate: number
  lastSyncTime: Date
}

export type QRMemberCard = {
  id: string
  memberId: string
  memberName: string
  kecamatan: string
  role: string
  joinDate: Date
  isActive: boolean
  qrCode: string // Base64 or URL
}
