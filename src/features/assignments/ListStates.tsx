import { CircleAlertIcon, InboxIcon, RotateCwIcon, SearchXIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { FILTER_LABELS, type AssignmentFilter } from '@/types'

/** Khung chung của danh sách: một bảng viền, cuộn bên trong. */
export const LIST_PANEL_CLASS =
  'flex h-[72dvh] min-h-[380px] flex-col overflow-hidden rounded-xl border bg-card lg:h-auto lg:min-h-0 lg:flex-1'

export function ListLoading() {
  return (
    <div className={LIST_PANEL_CLASS} role="status" aria-label="Đang tải danh sách bài tập">
      <p className="border-b px-4 py-2.5 text-sm text-muted-foreground">Đang tải danh sách bài tập…</p>
      <div className="flex flex-col">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex h-14 items-center gap-4 border-b px-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-20 sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface ListErrorProps {
  message: string | null
  onRetry: () => void
}

export function ListError({ message, onRetry }: ListErrorProps) {
  return (
    <div className={LIST_PANEL_CLASS}>
      <Empty role="alert">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
            <CircleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Không tải được danh sách bài tập</EmptyTitle>
          <EmptyDescription>{message ?? 'Máy chủ không phản hồi.'} Kiểm tra kết nối rồi tải lại.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onRetry}>
            <RotateCwIcon />
            Tải lại
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}

interface ListEmptyProps {
  filter: AssignmentFilter
  keyword: string
}

export function ListEmpty({ filter, keyword }: ListEmptyProps) {
  const searching = keyword.trim().length > 0

  return (
    <div className={LIST_PANEL_CLASS}>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">{searching ? <SearchXIcon /> : <InboxIcon />}</EmptyMedia>
          <EmptyTitle>
            {searching
              ? `Không có bài nào khớp “${keyword.trim()}”`
              : filter === 'all'
                ? 'Chưa có bài tập nào'
                : `Không có bài ở mục ${FILTER_LABELS[filter]}`}
          </EmptyTitle>
          <EmptyDescription>
            {searching
              ? 'Thử tên môn học hoặc một phần tên bài, không cần gõ dấu.'
              : filter === 'all'
                ? 'Bấm Thêm bài tập để tạo bài đầu tiên.'
                : 'Chọn bộ lọc khác để xem các bài còn lại.'}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
