import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminTableShell({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}
