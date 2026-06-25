import { Card } from "./card";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <Card className="flex flex-col items-center py-16" padding="lg">
      <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="mt-4 text-sm text-text-secondary">{message}</p>
    </Card>
  );
}

export function SkeletonCard() {
  return (
    <Card padding="md">
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-8 w-32" />
      <div className="skeleton mt-3 h-3 w-40" />
    </Card>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-border bg-surface-muted px-5 py-3">
        <div className="skeleton h-4 w-48" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div className="flex items-center gap-4 px-5 py-4" key={i}>
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-28" />
            <div className="skeleton size-8 rounded-[var(--radius-md)]" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <Card padding="md">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton mt-2 h-3 w-48" />
        <div className="skeleton mt-6 h-[280px] w-full" />
      </Card>
    </div>
  );
}
