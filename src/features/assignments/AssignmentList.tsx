import { useCallback, useEffect, useMemo } from 'react'
import { List, useListRef, type RowComponentProps } from 'react-window'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { usePinStore } from '@/features/pins/usePinStore'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import type { Assignment } from '@/types'
import { AssignmentCard, CARD_HEIGHT, LEDGER_COLUMNS } from './AssignmentCard'
import { filterAssignments, formatCount, searchAssignments, sortPinnedFirst } from './assignmentUtils'
import { fetchAssignments, removeAssignment, toggleComplete } from './assignmentsSlice'
import { LIST_PANEL_CLASS, ListEmpty, ListError, ListLoading } from './ListStates'
import { useAssignmentsLoader } from './useAssignmentsLoader'

interface RowData {
  items: Assignment[]
  pinnedIds: ReadonlySet<string>
  onToggleComplete: (id: string) => void
  onTogglePin: (id: string) => void
  onRemove: (id: string) => void
}

/** Một dòng của react-window: chỉ đặt vị trí (style), phần hiển thị giao cho AssignmentCard. */
function AssignmentRow({
  index,
  style,
  ariaAttributes,
  items,
  pinnedIds,
  onToggleComplete,
  onTogglePin,
  onRemove,
}: RowComponentProps<RowData>) {
  const assignment = items[index]
  return (
    <div style={style} {...ariaAttributes}>
      <AssignmentCard
        assignment={assignment}
        pinned={pinnedIds.has(assignment.id)}
        onToggleComplete={onToggleComplete}
        onTogglePin={onTogglePin}
        onRemove={onRemove}
      />
    </div>
  )
}

/** key theo id thay vì index: lọc hay ghim làm bài đổi chỗ nhưng vẫn giữ instance, AssignmentCard (memo) không render lại. */
function getRowKey(index: number, { items }: RowData) {
  return items[index].id
}

interface AssignmentListProps {
  /** Từ khoá đã debounce ở trang cha. */
  keyword?: string
}

export function AssignmentList({ keyword = '' }: AssignmentListProps) {
  const dispatch = useAppDispatch()
  const status = useAssignmentsLoader()
  const error = useAppSelector((state) => state.assignments.error)
  const items = useAppSelector((state) => state.assignments.items)
  const filter = useAppSelector((state) => state.assignments.filter)
  const pinnedIds = usePinStore((state) => state.pinnedIds)
  const togglePin = usePinStore((state) => state.togglePin)
  const wide = useMediaQuery('(min-width: 1024px)')
  const listRef = useListRef(null)

  // Lọc 10.000 bài chỉ chạy lại khi dữ liệu, bộ lọc, từ khoá (đã debounce) hoặc danh sách ghim đổi — không chạy theo từng phím.
  const visible = useMemo(
    () => sortPinnedFirst(searchAssignments(filterAssignments(items, filter), keyword), pinnedIds),
    [items, filter, keyword, pinnedIds],
  )
  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds])

  // Tham chiếu ổn định: react-window so sánh nông rowProps, AssignmentCard so sánh nông props.
  // Hàm mới mỗi lần render sẽ làm mọi dòng đang hiện render lại. togglePin của Zustand vốn đã ổn định.
  const handleToggleComplete = useCallback((id: string) => dispatch(toggleComplete(id)), [dispatch])
  const handleRemove = useCallback((id: string) => dispatch(removeAssignment(id)), [dispatch])

  // Kết quả tìm kiếm mới thì đọc từ đầu, không giữ vị trí cuộn của danh sách cũ.
  useEffect(() => {
    listRef.current?.scrollToRow({ index: 0 })
  }, [keyword, filter, listRef])

  if (status === 'idle' || status === 'loading') return <ListLoading />
  if (status === 'failed') {
    return <ListError message={error} onRetry={() => void dispatch(fetchAssignments())} />
  }
  if (visible.length === 0) return <ListEmpty filter={filter} keyword={keyword} />

  let pinnedCount = 0
  while (pinnedCount < visible.length && pinnedSet.has(visible[pinnedCount].id)) pinnedCount += 1

  return (
    <div className={LIST_PANEL_CLASS}>
      <div className="flex items-center justify-between gap-4 border-b px-4 py-2.5 text-sm text-muted-foreground">
        <p aria-live="polite">
          {visible.length === items.length ? (
            <>
              <strong className="font-semibold text-foreground tabular-nums">{formatCount(items.length)}</strong> bài tập
            </>
          ) : (
            <>
              Hiển thị <strong className="font-semibold text-foreground tabular-nums">{formatCount(visible.length)}</strong>{' '}
              trên {formatCount(items.length)} bài tập
            </>
          )}
        </p>
        {pinnedCount > 0 ? <p className="tabular-nums">{formatCount(pinnedCount)} bài đang ghim</p> : null}
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

      <List
        listRef={listRef}
        aria-label="Danh sách bài tập"
        className="min-h-0 flex-1"
        rowComponent={AssignmentRow}
        rowCount={visible.length}
        rowHeight={wide ? CARD_HEIGHT.wide : CARD_HEIGHT.compact}
        rowKey={getRowKey}
        rowProps={{
          items: visible,
          pinnedIds: pinnedSet,
          onToggleComplete: handleToggleComplete,
          onTogglePin: togglePin,
          onRemove: handleRemove,
        }}
        defaultHeight={480}
        overscanCount={4}
      />
    </div>
  )
}
