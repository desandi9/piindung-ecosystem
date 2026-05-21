export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background lg:pl-[260px] pt-16">
      <div className="p-4 lg:p-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-32 rounded-3xl bg-muted/50" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="h-32 rounded-2xl bg-muted/40" />
            <div className="h-32 rounded-2xl bg-muted/40" />
            <div className="h-32 rounded-2xl bg-muted/40" />
            <div className="h-32 rounded-2xl bg-muted/40" />
          </div>
          <div className="h-72 rounded-2xl bg-muted/40" />
        </div>
      </div>
    </div>
  )
}
