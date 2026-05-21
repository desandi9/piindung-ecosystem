import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn("border-t border-white/10 bg-zinc-950/80 p-4", className)}>
      {children}
    </div>
  )
}
