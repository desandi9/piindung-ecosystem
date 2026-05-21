import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AdminDialogShell({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <DialogContent className={className ?? "sm:max-w-2xl"}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      {children}
    </DialogContent>
  )
}
