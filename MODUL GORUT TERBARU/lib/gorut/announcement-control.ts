'use client'

import { createCollectionClient } from '@/services/api/record-client'
import { announcementData } from '@/lib/gorut/data'
import type { Announcement } from '@/lib/gorut/types'

export const GORUT_ANNOUNCEMENT_EVENT = 'gorut-announcement-updated'

const gorutAnnouncementClient = createCollectionClient<Announcement>({
  scope: 'gorut-announcements',
  defaultItems: announcementData,
  eventName: GORUT_ANNOUNCEMENT_EVENT,
  sort: (items) => [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
  }),
})

export function useGorutAnnouncements() {
  return gorutAnnouncementClient.useItems()
}

export async function createGorutAnnouncement(item: Announcement) {
  return gorutAnnouncementClient.createItem(item)
}

export async function updateGorutAnnouncement(id: string, updates: Partial<Announcement>) {
  return gorutAnnouncementClient.updateItem(id, updates)
}

export async function deleteGorutAnnouncement(id: string) {
  return gorutAnnouncementClient.deleteItem(id)
}
