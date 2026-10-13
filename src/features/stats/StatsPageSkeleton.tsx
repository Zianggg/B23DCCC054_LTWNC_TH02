import { Skeleton } from '@/components/ui/skeleton'

/** Fallback của Suspense khi chunk StatsPage đang tải — nằm trong bundle chính nên hiện ngay. */
export function StatsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Đang tải trang Thống kê">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-xl lg:col-span-2" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
