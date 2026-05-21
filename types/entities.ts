import type { AppRole } from "@/types/auth"

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface RoleEntity extends BaseEntity {
  name: AppRole | string
  displayName: string
  description: string
  permissions: string[]
}

export interface UserEntity extends BaseEntity {
  name: string
  email: string
  phoneNumber: string
  passwordHash?: string
  role: AppRole | string
  status: "active" | "pending" | "inactive"
  avatarUrl?: string
  lastLoginAt?: string
}

export interface ArticleEntity extends BaseEntity {
  title: string
  subtitle?: string
  slug: string
  summary: string
  content?: string
  coverImageUrl?: string
  category: "artikel" | "berita"
  publishStatus: "draft" | "published" | "archived"
  authorId?: string
}

export interface BannerEntity extends BaseEntity {
  title: string
  subtitle?: string
  description: string
  imageUrl: string
  buttonLabel: string
  buttonUrl: string
  publishStatus: "draft" | "published" | "archived"
  order: number
}

export interface NotificationEntity extends BaseEntity {
  title: string
  description: string
  type: "success" | "info" | "warning"
  unread: boolean
  published: boolean
  iconKey: string
  targetRoles?: Array<AppRole | string>
}

export interface GalleryEntity extends BaseEntity {
  title: string
  caption?: string
  imageUrl: string
  category?: string
  publishStatus: "draft" | "published" | "archived"
  order: number
}

export interface DownloadEntity extends BaseEntity {
  title: string
  description: string
  category: string
  fileName: string
  fileUrl: string
  fileSize?: string
  publishStatus: "draft" | "published" | "archived"
}

export interface ActivityLogEntity extends BaseEntity {
  actorName: string
  actorRole?: AppRole | string
  type: string
  action: string
  status: "Success" | "Warning" | "Failed"
  device?: string
  metadata?: Record<string, string | number | boolean | null>
}

export interface MediaAssetEntity extends BaseEntity {
  name: string
  type: "logo" | "banner" | "article thumbnail" | "document" | "gallery image" | string
  mimeType: string
  sizeLabel: string
  sizeBytes?: number
  assetUrl: string
  uploadedBy?: string
}

export interface AppDataModelMap {
  users: UserEntity
  roles: RoleEntity
  articles: ArticleEntity
  banners: BannerEntity
  notifications: NotificationEntity
  gallery: GalleryEntity
  downloads: DownloadEntity
  activityLogs: ActivityLogEntity
  mediaAssets: MediaAssetEntity
}
