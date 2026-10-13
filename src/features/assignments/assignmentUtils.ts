import { isOverdueDeadline, type Assignment, type AssignmentFilter, type DeadlineInfo } from '@/types'

const MS_PER_DAY = 86_400_000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * 'YYYY-MM-DD' → 00:00 giờ địa phương.
 * new Date('2026-10-13') hiểu chuỗi là nửa đêm UTC, nên ở múi giờ âm sẽ lùi sang ngày hôm trước.
 */
export function parseDueDate(dueDate: string): Date {
  const match = ISO_DATE.exec(dueDate)
  if (!match) return new Date(dueDate)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Số ngày từ hôm nay tới hạn nộp: dương là còn hạn, 0 là hạn hôm nay, âm là đã quá hạn. */
export function calcDaysLeft(dueDate: string, now: Date = new Date()): number {
  const due = startOfDay(parseDueDate(dueDate))
  // Math.round bù ngày 23 hoặc 25 giờ khi đổi giờ mùa hè.
  return Math.round((due.getTime() - startOfDay(now).getTime()) / MS_PER_DAY)
}

/** Quá hạn = chưa hoàn thành và hạn nộp đã qua. Hạn hôm nay chưa tính là quá hạn. */
export function isOverdue(assignment: Pick<Assignment, 'dueDate' | 'completed'>, now: Date = new Date()): boolean {
  return !assignment.completed && calcDaysLeft(assignment.dueDate, now) < 0
}

export function getDeadlineInfo(dueDate: string, now: Date = new Date()): DeadlineInfo {
  const days = calcDaysLeft(dueDate, now)
  return days < 0 ? { kind: 'overdue', days: -days } : { kind: 'remaining', days }
}

export function formatDeadlineLabel(info: DeadlineInfo): string {
  if (isOverdueDeadline(info)) return `Quá hạn ${info.days} ngày`
  return info.days === 0 ? 'Hạn hôm nay' : `Còn ${info.days} ngày`
}

export function filterAssignments(
  items: Assignment[],
  filter: AssignmentFilter,
  now: Date = new Date(),
): Assignment[] {
  switch (filter) {
    case 'incomplete':
      return items.filter((item) => !item.completed)
    case 'completed':
      return items.filter((item) => item.completed)
    case 'overdue':
      return items.filter((item) => isOverdue(item, now))
    default:
      return items
  }
}

const DIACRITICS = /[̀-ͯ]/g

/** Bỏ dấu tiếng Việt và chữ hoa: "Bài Tập" và "bai tap" khớp nhau. */
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(DIACRITICS, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()
}

/** Tìm theo tên bài hoặc tên môn. Từ khoá rỗng trả lại đúng mảng đầu vào (giữ tham chiếu). */
export function searchAssignments(items: Assignment[], keyword: string): Assignment[] {
  const query = normalizeText(keyword)
  if (!query) return items
  return items.filter((item) => normalizeText(`${item.title} ${item.course}`).includes(query))
}

/** Bài đã ghim lên đầu, thứ tự bên trong mỗi nhóm giữ nguyên. Không có bài ghim thì trả lại mảng cũ. */
export function sortPinnedFirst(items: Assignment[], pinnedIds: readonly string[]): Assignment[] {
  if (pinnedIds.length === 0) return items
  const pinned = new Set(pinnedIds)
  const top: Assignment[] = []
  const rest: Assignment[] = []
  for (const item of items) {
    if (pinned.has(item.id)) top.push(item)
    else rest.push(item)
  }
  return top.length === 0 ? items : top.concat(rest)
}

/** Bài chưa xong có hạn nộp sớm nhất — dùng cho mục "Hạn gần nhất". */
export function getNearestOpenAssignment(items: Assignment[]): Assignment | undefined {
  let nearest: Assignment | undefined
  for (const item of items) {
    if (!item.completed && (!nearest || item.dueDate < nearest.dueDate)) nearest = item
  }
  return nearest
}

export interface CourseStats {
  course: string
  total: number
  completed: number
  overdue: number
}

export interface AssignmentStats {
  total: number
  completed: number
  /** Chưa hoàn thành, gồm cả bài quá hạn. */
  incomplete: number
  overdue: number
  /** Chưa hoàn thành và còn hạn. */
  onTime: number
  /** Phần trăm đã hoàn thành, 0–100, làm tròn. */
  completionRate: number
  /** Theo môn, môn nhiều bài nhất lên trước. */
  byCourse: CourseStats[]
}

/** Một vòng lặp cho mọi con số của trang Thống kê và bộ đếm trên tab lọc. */
export function calcStats(items: Assignment[], now: Date = new Date()): AssignmentStats {
  let completed = 0
  let overdue = 0
  const courses = new Map<string, CourseStats>()

  for (const item of items) {
    let course = courses.get(item.course)
    if (!course) {
      course = { course: item.course, total: 0, completed: 0, overdue: 0 }
      courses.set(item.course, course)
    }
    course.total += 1
    if (item.completed) {
      completed += 1
      course.completed += 1
    } else if (isOverdue(item, now)) {
      overdue += 1
      course.overdue += 1
    }
  }

  const total = items.length
  const incomplete = total - completed

  return {
    total,
    completed,
    incomplete,
    overdue,
    onTime: incomplete - overdue,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    byCourse: [...courses.values()].sort((a, b) => b.total - a.total || a.course.localeCompare(b.course, 'vi')),
  }
}

const numberFormat = new Intl.NumberFormat('vi-VN')

/** 10000 → "10.000". */
export function formatCount(value: number): string {
  return numberFormat.format(value)
}

const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** '2026-10-13' → "13/10/2026". */
export function formatDueDate(dueDate: string): string {
  return dateFormat.format(parseDueDate(dueDate))
}
