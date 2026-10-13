import { memo } from 'react'
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  PinIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PRIORITY_LABELS, type Assignment, type Priority } from '@/types'
import { formatDueDate, getDeadlineInfo } from './assignmentUtils'

export interface AssignmentCardProps {
  assignment: Assignment
  pinned: boolean
  onToggleComplete: (id: string) => void
  onTogglePin: (id: string) => void
  onRemove: (id: string) => void
}

/** Cột của dòng (≥ lg) — dùng chung với hàng tiêu đề cột trong AssignmentList. */
export const LEDGER_COLUMNS = 'lg:grid-cols-[minmax(0,1fr)_120px_104px_150px_112px]'

/** Chiều cao cố định của một dòng — react-window cần biết trước để tính vị trí. */
export const CARD_HEIGHT = { compact: 68, wide: 60 } as const

const PRIORITY_ICON: Record<Priority, typeof ArrowUpIcon> = {
  high: ArrowUpIcon,
  medium: ArrowRightIcon,
  low: ArrowDownIcon,
}

function StatusBadge({ assignment }: { assignment: Assignment }) {
  if (assignment.completed) {
    return (
      <Badge variant="secondary">
        <CircleCheckIcon />
        Đã xong
      </Badge>
    )
  }
  const deadline = getDeadlineInfo(assignment.dueDate)
  if (deadline.kind === 'overdue') {
    return (
      <Badge variant="destructive">
        <CircleAlertIcon />
        Quá hạn {deadline.days} ngày
      </Badge>
    )
  }
  const soon = deadline.days <= 3
  return (
    <Badge variant="outline" className={soon ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}>
      <ClockIcon />
      {deadline.days === 0 ? 'Hạn hôm nay' : `Còn ${deadline.days} ngày`}
    </Badge>
  )
}

function AssignmentCard({ assignment, pinned, onToggleComplete, onTogglePin, onRemove }: AssignmentCardProps) {
  const { id, title, course, dueDate, priority, completed } = assignment
  const PriorityIcon = PRIORITY_ICON[priority]

  return (
    <article
      aria-label={title}
      data-pinned={pinned ? '' : undefined}
      className={cn(
        'grid h-full grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-4 gap-y-1 border-b px-4 transition-colors hover:bg-muted/50 lg:gap-y-0.5',
        LEDGER_COLUMNS,
        pinned && 'bg-muted/40',
      )}
    >
      <h3
        title={title}
        className={cn(
          'col-start-1 row-start-1 min-w-0 truncate text-sm font-medium',
          completed && 'text-muted-foreground line-through',
        )}
      >
        {title}
      </h3>

      {/* Dưới lg: dòng phụ gồm trạng thái và môn. Từ lg: display: contents, môn nằm dưới tên bài, phần còn lại thành cột. */}
      <div className="col-start-1 row-start-2 flex min-w-0 items-center gap-2 lg:contents">
        <div className="shrink-0 lg:col-start-4 lg:row-span-2 lg:row-start-1">
          <StatusBadge assignment={assignment} />
        </div>

        <p className="min-w-0 truncate text-xs text-muted-foreground lg:col-start-1 lg:row-start-2">{course}</p>

        <p className="hidden items-center gap-1.5 text-sm lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex">
          <PriorityIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="sr-only">Ưu tiên </span>
          {PRIORITY_LABELS[priority]}
        </p>

        <time
          dateTime={dueDate}
          className="sr-only text-sm text-muted-foreground tabular-nums lg:not-sr-only lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:self-center"
        >
          {formatDueDate(dueDate)}
        </time>
      </div>

      <div className="col-start-2 row-span-2 row-start-1 flex items-center justify-end gap-0.5 lg:col-start-5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-pressed={pinned}
          aria-label={pinned ? `Bỏ ghim ${title}` : `Ghim ${title}`}
          title={pinned ? 'Bỏ ghim' : 'Ghim lên đầu danh sách'}
          className={pinned ? 'text-foreground' : 'text-muted-foreground'}
          onClick={() => onTogglePin(id)}
        >
          <PinIcon className={pinned ? 'fill-current' : undefined} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={completed ? `Mở lại ${title}` : `Đánh dấu hoàn thành ${title}`}
          title={completed ? 'Mở lại' : 'Đánh dấu hoàn thành'}
          className="text-muted-foreground"
          onClick={() => onToggleComplete(id)}
        >
          {completed ? <RotateCcwIcon /> : <CheckIcon />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Xóa ${title}`}
          title="Xóa"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(id)}
        >
          <Trash2Icon />
        </Button>
      </div>
    </article>
  )
}

/**
 * Bản memo dùng trong danh sách: dòng chỉ render lại khi chính bài đó, trạng thái ghim
 * hoặc handler đổi. Handler phải ổn định (useCallback / action của Zustand), nếu không memo vô tác dụng.
 */
const MemoizedAssignmentCard = memo(AssignmentCard)

export { MemoizedAssignmentCard as AssignmentCard }

/** Bản không memo — chỉ src/before (chế độ đo "trước tối ưu") dùng, để so sánh với bản memo. */
export { AssignmentCard as PlainAssignmentCard }
