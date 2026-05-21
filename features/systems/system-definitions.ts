import { ACTIVITY_LOG_STORAGE_KEY } from "@/lib/activity-log"
import { ADMIN_INBOX_STORAGE_KEY } from "@/lib/admin-inbox"
import { HELP_FAQ_STORAGE_KEY } from "@/lib/faq-manager"
import { MAINTENANCE_MODE_STORAGE_KEY } from "@/lib/maintenance-mode"
import { MEDIA_LIBRARY_STORAGE_KEY } from "@/lib/media-library"
import { NOTIFICATIONS_STORAGE_KEY } from "@/lib/notifications"
import { POPUP_STORAGE_KEY } from "@/lib/popup-announcements"

export interface ReusableSystemDefinition {
  id: "notifications" | "activity-logs" | "media-uploads" | "popup-system" | "faq" | "maintenance-mode"
  label: string
  route: string
  storageKey: string
  description: string
}

export const reusableSystemDefinitions: ReusableSystemDefinition[] = [
  {
    id: "notifications",
    label: "Notifications",
    route: "/admin/notifikasi",
    storageKey: NOTIFICATIONS_STORAGE_KEY,
    description: "Reusable publish/read notification system untuk dashboard dan modul masa depan.",
  },
  {
    id: "activity-logs",
    label: "Activity Logs",
    route: "/admin/activity",
    storageKey: ACTIVITY_LOG_STORAGE_KEY,
    description: "Reusable audit trail untuk login, user actions, system changes, dan future operational flows.",
  },
  {
    id: "media-uploads",
    label: "Media Uploads",
    route: "/admin/media",
    storageKey: MEDIA_LIBRARY_STORAGE_KEY,
    description: "Reusable media asset storage untuk banner, galeri, artikel, dokumen, dan future modules.",
  },
  {
    id: "popup-system",
    label: "Popup System",
    route: "/admin/popup",
    storageKey: POPUP_STORAGE_KEY,
    description: "Reusable announcement popup system untuk homepage dan future operational modules.",
  },
  {
    id: "faq",
    label: "FAQ",
    route: "/admin/faq",
    storageKey: HELP_FAQ_STORAGE_KEY,
    description: "Reusable knowledge base untuk bantuan publik dan future user support modules.",
  },
  {
    id: "maintenance-mode",
    label: "Maintenance Mode",
    route: "/admin/maintenance",
    storageKey: MAINTENANCE_MODE_STORAGE_KEY,
    description: "Reusable global gating system untuk maintenance state di seluruh ekosistem PIINDUNG.",
  },
]

export const communicationStorageKeys = [NOTIFICATIONS_STORAGE_KEY, ADMIN_INBOX_STORAGE_KEY, HELP_FAQ_STORAGE_KEY]
