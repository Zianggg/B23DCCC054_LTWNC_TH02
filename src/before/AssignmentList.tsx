import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { LEDGER_COLUMNS, PlainAssignmentCard } from '@/features/assignments/AssignmentCard'
import { filterAssignments, formatCount, searchAssignments, sortPinnedFirst } from '@/features/assignments/assignmentUtils'
import { fetchAssignments, removeAssignment, toggleComplete } from '@/features/assignments/assignmentsSlice'
import { LIST_PANEL_CLASS, ListEmpty, ListError, ListLoading } from '@/features/assignments/ListStates'
import { useAssignmentsLoader } from '@/features/assignments/useAssignmentsLoader'
import { usePinStore } from '@/features/pins/usePinStore'
import { cn } from '@/lib/utils'

/**
 * BẢN TRƯỚC TỐI ƯU — chỉ build khi chạy `--mode before`, dùng để đo so sánh.
 * Cố ý không có: useMemo cho phần lọc, useCallback cho handler, React.memo cho thẻ, virtualization.
 * Mỗi lần render lọc lại toàn bộ danh sách và render đủ mọi thẻ khớp.
 */
export function AssignmentList({ keyword = '' }: { keyword?: string }) {
  const dispatch = useAppDispatch()
  const status = useAssignmentsLoader()
  const error = useAppSelector((state) => state.assignments.error)
  const items = useAppSelector((state) => state.assignments.items)
  const filter = useAppSelector((state) => state.assignments.filter)
  const pinnedIds = usePinStore((state) => state.pinnedIds)
  const togglePin = usePinStore((state) => state.togglePin)

  if (status === 'idle' || status === 'loading') return <ListLoading />
  if (status === 'failed') {
    return <ListError message={error} onRetry={() => void dispatch(fetchAssignments())} />
  }

  const visible = sortPinnedFirst(searchAssignments(filterAssignments(items, filter), keyword), pinnedIds)
  if (visible.length === 0) return <ListEmpty filter={filter} keyword={keyword} />

  return (
    <div className={LIST_PANEL_CLASS}>
      <div className="border-b px-4 py-2.5 text-sm text-muted-foreground">
        <p>
          Hiển thị <strong className="font-semibold text-foreground tabular-nums">{formatCount(visible.length)}</strong>{' '}
          trên {formatCount(items.length)} bài tập
        </p>
      </div>
      <div
        aria-hidden="true"
        className={cn(
          'hidden h-10 items-center gap-x-4 border-b bg-muted/50 px-4 text-sm font-medium text-muted-foreground lg:grid',
          LEDGER_COLUMNS,
        )}
      >
        <span>Bài tập</span>
        <span>Ưu tiên</span>
        <span>Hạn nộp</span>
        <span>Trạng thái</span>
        <span className="sr-only">Thao tác</span>
      </div>
      <div role="list" aria-label="Danh sách bài tập" className="min-h-0 flex-1 overflow-y-auto">
        {visible.map((assignment) => (
          <div key={assignment.id} role="listitem" className="h-[68px] lg:h-15">
            <PlainAssignmentCard
              assignment={assignment}
              pinned={pinnedIds.includes(assignment.id)}
              onToggleComplete={(id) => dispatch(toggleComplete(id))}
              onTogglePin={(id) => togglePin(id)}
              onRemove={(id) => dispatch(removeAssignment(id))}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
