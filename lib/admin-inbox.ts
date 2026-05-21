"use client"

import { createCollectionClient } from "@/services/api/record-client"

export type InboxMessageSource = "Kontak Kami" | "Konsultasi" | "Bantuan"
export type InboxMessageStatus = "Unread" | "Read"

export interface InboxMessage {
  id: string
  source: InboxMessageSource
  title: string
  senderName: string
  senderEmail: string
  senderPhone: string
  message: string
  status: InboxMessageStatus
  createdAt: string
  createdAtLabel: string
  repliedAt?: string
  repliedAtLabel?: string
  replyMessage?: string
}

export const ADMIN_INBOX_STORAGE_KEY = "piindung-admin-inbox"
export const ADMIN_INBOX_EVENT = "piindung-admin-inbox-updated"

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function sortMessages(messages: InboxMessage[]) {
  return [...messages].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}

function dispatchInboxEvent(messages: InboxMessage[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<InboxMessage[]>(ADMIN_INBOX_EVENT, { detail: messages }))
}

const inboxClient = createCollectionClient<InboxMessage>({
  scope: "admin-inbox",
  defaultItems: [],
  eventName: ADMIN_INBOX_EVENT,
  sort: sortMessages,
})

export function readInboxMessages() {
  return inboxClient.readItemsSync()
}

export function writeInboxMessages(messages: InboxMessage[]) {
  void inboxClient.writeItems(messages)
}

export function addInboxMessage(
  message: Omit<InboxMessage, "id" | "status" | "createdAt" | "createdAtLabel" | "repliedAt" | "repliedAtLabel" | "replyMessage">
) {
  const createdAt = new Date()
  const nextMessage: InboxMessage = {
    id: `inbox-${Date.now()}`,
    status: "Unread",
    createdAt: createdAt.toISOString(),
    createdAtLabel: formatDateTime(createdAt),
    ...message,
  }

  writeInboxMessages([nextMessage, ...readInboxMessages()])
}

export function updateInboxMessageStatus(messageId: string, status: InboxMessageStatus) {
  writeInboxMessages(
    readInboxMessages().map((message) => {
      if (message.id !== messageId) return message
      return { ...message, status }
    })
  )
}

export function markAllInboxMessagesAsRead() {
  writeInboxMessages(
    readInboxMessages().map((message) => ({ ...message, status: "Read" as const }))
  )
}

export function replyToInboxMessage(messageId: string, replyMessage: string) {
  const repliedAt = new Date()

  writeInboxMessages(
    readInboxMessages().map((message) => {
      if (message.id !== messageId) return message

      return {
        ...message,
        status: "Read" as const,
        replyMessage,
        repliedAt: repliedAt.toISOString(),
        repliedAtLabel: formatDateTime(repliedAt),
      }
    })
  )
}

export function deleteInboxMessage(messageId: string) {
  writeInboxMessages(readInboxMessages().filter((message) => message.id !== messageId))
}

export function getUnreadInboxCount(messages: InboxMessage[]) {
  return messages.filter((message) => message.status === "Unread").length
}

export function useInboxMessages() {
  return inboxClient.useItems()
}
