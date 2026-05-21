import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminSectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
