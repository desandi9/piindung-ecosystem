import { randomUUID } from "crypto"
import { createRecord } from "@/lib/record-store-server"

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export async function createUploadAuditLog({
  userName,
  action,
  status,
  optimizationMetrics,
}: {
  userName: string
  action: string
  status: "Success" | "Warning" | "Failed"
  optimizationMetrics?: {
    originalSize: number
    optimizedSize: number
    savedBytes: number
    savedPercent: number
    folder?: string
    fileName?: string
  }
}) {
  await createRecord("activity-log", `upload-${Date.now()}-${randomUUID()}`, {
    id: `log-${Date.now()}-${randomUUID()}`,
    userName,
    type: "System",
    action,
    dateTime: formatDateTime(new Date()),
    device: "Server Upload Optimizer",
    status,
    optimizationMetrics,
  })
}
