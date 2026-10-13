import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  BookOpenIcon,
  CalendarClockIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  ListIcon,
  RotateCwIcon,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  calcStats,
  formatCount,
  formatDeadlineLabel,
  getDeadlineInfo,
  getNearestOpenAssignment,
} from '@/features/assignments/assignmentUtils'
import { fetchAssignments, setFilter } from '@/features/assignments/assignmentsSlice'
import { useAssignmentsLoader } from '@/features/assignments/useAssignmentsLoader'
import { cn } from '@/lib/utils'
import { FILTER_LABELS, type AssignmentFilter } from '@/types'
import { StatsPageSkeleton } from './StatsPageSkeleton'

interface Segment {
  filter: AssignmentFilter
  label: string
  value: number
  bar: string
  icon: ReactNode
}

interface KpiProps {
  label: string
  value: string
  note: string
  icon: ReactNode
}

function Kpi({ label, value, note, icon }: KpiProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums group-data-[size=sm]/card:text-2xl">{value}</CardTitle>
        <CardAction className="text-muted-foreground [&_svg]:size-4">{icon}</CardAction>
      </CardHeader>
      <CardFooter className="text-xs text-muted-foreground">{note}</CardFooter>
    </Card>
  )
}

/** Trang Thống kê — tải bằng React.lazy, chỉ vào bundle khi người dùng mở /thong-ke. */
export default function StatsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const status = useAssignmentsLoader()
  const items = useAppSelector((state) => state.assignments.items)
  const error = useAppSelector((state) => state.assignments.error)
  const stats = useMemo(() => calcStats(items), [items])
  const nearest = useMemo(() => getNearestOpenAssignment(items), [items])

  if (status === 'idle' || status === 'loading') return <StatsPageSkeleton />

  if (status === 'failed') {
    return (
      <Empty className="rounded-xl border" role="alert">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
            <CircleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Chưa có dữ liệu để thống kê</EmptyTitle>
          <EmptyDescription>{error ?? 'Không tải được danh sách bài tập.'} Tải lại để thử lần nữa.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => void dispatch(fetchAssignments())}>
            <RotateCwIcon />
            Tải lại
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const openList = (filter: AssignmentFilter) => {
    dispatch(setFilter(filter))
    void navigate('/')
  }

  if (stats.total === 0) {
    return (
      <Empty className="rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListIcon />
          </EmptyMedia>
          <EmptyTitle>Chưa có bài tập để thống kê</EmptyTitle>
          <EmptyDescription>Thêm bài tập ở trang Danh sách, số liệu sẽ hiện ở đây.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => openList('all')}>Mở danh sách</Button>
        </EmptyContent>
      </Empty>
    )
  }

  // "Còn hạn" mở bộ lọc Chưa hoàn thành (app không có bộ lọc riêng cho bài còn hạn), nhãn ghi rõ đích đến.
  const segments: Segment[] = [
    {
      filter: 'completed',
      label: 'Đã hoàn thành',
      value: stats.completed,
      bar: 'bg-emerald-600 dark:bg-emerald-500',
      icon: <CircleCheckIcon className="text-emerald-600 dark:text-emerald-500" />,
    },
    {
      filter: 'incomplete',
      label: 'Còn hạn',
      value: stats.onTime,
      bar: 'bg-primary',
      icon: <ClockIcon className="text-primary" />,
    },
    {
      filter: 'overdue',
      label: 'Quá hạn',
      value: stats.overdue,
      bar: 'bg-destructive',
      icon: <CircleAlertIcon className="text-destructive" />,
    },
  ]
  const nearestInfo = nearest ? getDeadlineInfo(nearest.dueDate) : null

  return (
    <div className="flex flex-col gap-4 lg:-m-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:p-1">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Thống kê</h1>
        <p className="text-sm text-muted-foreground">Tính trên {formatCount(stats.total)} bài tập hiện có.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Tổng số bài"
          value={formatCount(stats.total)}
          note={`${formatCount(stats.byCourse.length)} môn học`}
          icon={<BookOpenIcon />}
        />
        <Kpi
          label="Đã hoàn thành"
          value={formatCount(stats.completed)}
          note={`${stats.completionRate}% tổng số bài`}
          icon={<CircleCheckIcon />}
        />
        <Kpi
          label="Còn hạn"
          value={formatCount(stats.onTime)}
          note="Chưa xong, vẫn trong hạn nộp"
          icon={<ClockIcon />}
        />
        <Kpi
          label="Quá hạn"
          value={formatCount(stats.overdue)}
          note="Chưa xong, đã qua hạn nộp"
          icon={<CircleAlertIcon />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tiến độ hoàn thành</CardTitle>
            <CardDescription>Bấm vào một phần để mở danh sách đã lọc.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="flex items-baseline gap-3">
              <p className="text-5xl leading-none font-semibold tracking-tight">
                {stats.completionRate}
                <span className="text-2xl font-medium text-muted-foreground">%</span>
              </p>
              <p className="text-sm text-muted-foreground">
                hoàn thành, {formatCount(stats.completed)} trên {formatCount(stats.total)} bài
              </p>
            </div>

            {/* Khe 2px giữa các đoạn thay cho viền; đầu phải bo 4px, gốc trái vuông. */}
            <TooltipProvider>
              <div className="flex h-3 gap-0.5" role="group" aria-label="Tỉ lệ bài theo trạng thái">
                {segments.map((segment) =>
                  segment.value > 0 ? (
                    <Tooltip key={segment.filter}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`${segment.label}: ${formatCount(segment.value)} bài. Mở danh sách ${FILTER_LABELS[segment.filter]}`}
                          className={cn(
                            'h-full min-w-1.5 basis-0 transition-opacity last:rounded-r-[4px] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                            segment.bar,
                          )}
                          style={{ flexGrow: segment.value }}
                          onClick={() => openList(segment.filter)}
                        />
                      </TooltipTrigger>
                      <TooltipContent sideOffset={6}>
                        <strong className="font-semibold">{formatCount(segment.value)}</strong> {segment.label.toLowerCase()}
                      </TooltipContent>
                    </Tooltip>
                  ) : null,
                )}
              </div>
            </TooltipProvider>

            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {segments.map((segment) => (
                <li key={segment.filter}>
                  <button
                    type="button"
                    title={`Mở danh sách ${FILTER_LABELS[segment.filter]}`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground [&_svg]:size-4"
                    onClick={() => openList(segment.filter)}
                  >
                    {segment.icon}
                    {segment.label}{' '}
                    <strong className="font-semibold text-foreground tabular-nums">{formatCount(segment.value)}</strong>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hạn gần nhất</CardTitle>
            <CardDescription>Bài chưa xong có hạn nộp sớm nhất.</CardDescription>
            <CardAction className="text-muted-foreground [&_svg]:size-4">
              <CalendarClockIcon />
            </CardAction>
          </CardHeader>
          <CardContent className="gap-2">
            {nearest && nearestInfo ? (
              <>
                <p className="leading-snug font-medium">{nearest.title}</p>
                <p className="text-sm text-muted-foreground">{nearest.course}</p>
                <Badge variant={nearestInfo.kind === 'overdue' ? 'destructive' : 'outline'}>
                  {formatDeadlineLabel(nearestInfo)}
                </Badge>
              </>
            ) : (
              <p className="font-medium">Không còn bài chưa hoàn thành</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theo môn học</CardTitle>
          <CardDescription>Môn nhiều bài nhất lên trước. Quá hạn chỉ tính bài chưa hoàn thành.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Môn học</TableHead>
                <TableHead className="text-right">Tổng</TableHead>
                <TableHead className="text-right">Đã xong</TableHead>
                <TableHead className="text-right">Quá hạn</TableHead>
                <TableHead className="w-[38%]">Tiến độ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.byCourse.map((course) => {
                const rate = Math.round((course.completed / course.total) * 100)
                return (
                  <TableRow key={course.course}>
                    <TableCell className="font-medium">{course.course}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(course.total)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(course.completed)}</TableCell>
                    <TableCell className={cn('text-right tabular-nums', course.overdue > 0 && 'text-destructive')}>
                      {formatCount(course.overdue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={rate} aria-label={`Tiến độ ${course.course}`} className="h-2" />
                        <span className="w-10 shrink-0 text-right text-muted-foreground tabular-nums">{rate}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
