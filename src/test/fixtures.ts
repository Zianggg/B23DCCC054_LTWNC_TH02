import type { AssignmentsState } from '@/features/assignments/assignmentsSlice'
import type { Assignment } from '@/types'

/** Mốc thời gian cố định cho test: thứ Ba 13/10/2026, 09:00 giờ địa phương. */
export const NOW = new Date(2026, 9, 13, 9, 0, 0)

/** Ngày YYYY-MM-DD cách hôm nay `offset` ngày — cho component tự tính "Còn X ngày" theo ngày thật. */
export function isoDaysFromToday(offset: number): string {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: 'a-1',
    course: 'Lập trình web nâng cao',
    title: 'Bài thực hành 02',
    dueDate: '2026-10-17',
    priority: 'high',
    completed: false,
    ...overrides,
  }
}

export function makeAssignmentsState(overrides: Partial<AssignmentsState> = {}): AssignmentsState {
  return {
    items: [],
    status: 'succeeded',
    error: null,
    filter: 'all',
    ...overrides,
  }
}
