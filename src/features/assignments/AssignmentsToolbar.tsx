import { useMemo } from 'react'
import { FlaskConicalIcon, RotateCwIcon, SearchIcon, XIcon } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { AddAssignmentDialog } from './AddAssignmentDialog'
import { calcStats } from './assignmentUtils'
import { fetchAssignments, seedAssignments, setFilter } from './assignmentsSlice'
import { FilterTabs } from './FilterTabs'
import { STRESS_TEST_SIZE } from './stressData'

interface AssignmentsToolbarProps {
  keyword: string
  onKeywordChange: (keyword: string) => void
}

/** Tiêu đề, thao tác, ô tìm kiếm và tab lọc của trang Danh sách. Dùng chung cho bản trước và sau tối ưu. */
export function AssignmentsToolbar({ keyword, onKeywordChange }: AssignmentsToolbarProps) {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.assignments.status)
  const filter = useAppSelector((state) => state.assignments.filter)
  const items = useAppSelector((state) => state.assignments.items)
  // Gõ phím làm toolbar render lại (keyword đổi) nhưng items không đổi, nên không đếm lại 10.000 bài.
  const stats = useMemo(() => calcStats(items), [items])
  const loading = status === 'loading'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Danh sách bài tập</h1>
          <p className="text-sm text-muted-foreground">Theo dõi hạn nộp, ghim bài quan trọng lên đầu danh sách.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void dispatch(fetchAssignments())} disabled={loading}>
            <RotateCwIcon className={loading ? 'animate-spin' : undefined} />
            {loading ? 'Đang tải' : 'Tải lại'}
          </Button>
          <Button
            variant="outline"
            onClick={() => dispatch(seedAssignments(STRESS_TEST_SIZE))}
            disabled={loading}
            title="Thay danh sách hiện tại bằng 10.000 bài sinh tự động để đo hiệu năng"
          >
            <FlaskConicalIcon />
            Tạo 10.000 bài tập mẫu
          </Button>
          <AddAssignmentDialog />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <InputGroup className="lg:max-w-sm">
          <InputGroupInput
            type="search"
            className="[&::-webkit-search-cancel-button]:appearance-none"
            aria-label="Tìm bài tập"
            placeholder="Tìm theo tên bài hoặc môn học"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          {keyword ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Xóa từ khoá" onClick={() => onKeywordChange('')}>
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        <FilterTabs value={filter} onChange={(next) => dispatch(setFilter(next))}>
          <FilterTabs.List>
            <FilterTabs.Tab value="all" count={stats.total} />
            <FilterTabs.Tab value="incomplete" count={stats.incomplete} />
            <FilterTabs.Tab value="overdue" count={stats.overdue} />
            <FilterTabs.Tab value="completed" count={stats.completed} />
          </FilterTabs.List>
        </FilterTabs>
      </div>
    </div>
  )
}
