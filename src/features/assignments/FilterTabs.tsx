import type { ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FILTER_LABELS, isAssignmentFilter, type AssignmentFilter } from '@/types'
import { formatCount } from './assignmentUtils'

/**
 * Compound Component (Buổi 2): FilterTabs + FilterTabs.List + FilterTabs.Tab.
 * Bản TH02 dựng trên Tabs của shadcn/ui (Radix) — state chọn tab và điều hướng bằng phím mũi tên do Radix lo.
 */
interface FilterTabsProps {
  value: AssignmentFilter
  onChange: (next: AssignmentFilter) => void
  children: ReactNode
}

function FilterTabs({ value, onChange, children }: FilterTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (isAssignmentFilter(next)) onChange(next)
      }}
    >
      {children}
    </Tabs>
  )
}

function List({ children }: { children: ReactNode }) {
  return (
    <TabsList aria-label="Lọc theo trạng thái" className="w-full justify-start overflow-x-auto sm:w-fit">
      {children}
    </TabsList>
  )
}

interface TabProps {
  value: AssignmentFilter
  count?: number
  children?: ReactNode
}

function Tab({ value, count, children }: TabProps) {
  return (
    <TabsTrigger value={value} className="flex-none px-2.5">
      {children ?? FILTER_LABELS[value]}
      {/* Khoảng trắng để tên truy cập là "Quá hạn 2", không dính thành "Quá hạn2". */}
      {typeof count === 'number' ? ' ' : null}
      {typeof count === 'number' ? (
        <span className="rounded-full bg-muted-foreground/15 px-1.5 text-xs font-medium tabular-nums">{formatCount(count)}</span>
      ) : null}
    </TabsTrigger>
  )
}

FilterTabs.List = List
FilterTabs.Tab = Tab

export { FilterTabs }
