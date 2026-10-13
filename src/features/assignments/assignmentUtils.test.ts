import { makeAssignment, NOW } from '@/test/fixtures'
import {
  calcDaysLeft,
  calcStats,
  filterAssignments,
  formatCount,
  formatDeadlineLabel,
  formatDueDate,
  getDeadlineInfo,
  getNearestOpenAssignment,
  isOverdue,
  normalizeText,
  parseDueDate,
  searchAssignments,
  sortPinnedFirst,
} from './assignmentUtils'

describe('calcDaysLeft', () => {
  it('đếm số ngày tới hạn: dương khi còn hạn, 0 khi hạn hôm nay, âm khi đã qua', () => {
    expect(calcDaysLeft('2026-10-17', NOW)).toBe(4)
    expect(calcDaysLeft('2026-10-13', NOW)).toBe(0)
    expect(calcDaysLeft('2026-10-10', NOW)).toBe(-3)
  })

  it('không phụ thuộc giờ trong ngày và tính đúng qua ranh giới tháng, năm', () => {
    const lateEvening = new Date(2026, 9, 13, 23, 59, 59)
    expect(calcDaysLeft('2026-10-14', lateEvening)).toBe(1)
    expect(calcDaysLeft('2026-11-01', new Date(2026, 9, 31, 8))).toBe(1)
    expect(calcDaysLeft('2027-01-01', new Date(2026, 11, 31, 8))).toBe(1)
  })

  it('đọc YYYY-MM-DD theo giờ địa phương, chuỗi khác thì để Date tự phân tích', () => {
    expect(parseDueDate('2026-10-13').getDate()).toBe(13)
    expect(parseDueDate('2026-10-13T10:00:00').getHours()).toBe(10)
  })
})

describe('isOverdue', () => {
  it('chỉ quá hạn khi chưa hoàn thành và hạn nộp đã qua', () => {
    expect(isOverdue(makeAssignment({ dueDate: '2026-10-12' }), NOW)).toBe(true)
    expect(isOverdue(makeAssignment({ dueDate: '2026-10-12', completed: true }), NOW)).toBe(false)
  })

  it('trường hợp biên: hạn đúng hôm nay chưa tính là quá hạn', () => {
    expect(isOverdue(makeAssignment({ dueDate: '2026-10-13' }), NOW)).toBe(false)
  })
})

describe('getDeadlineInfo / formatDeadlineLabel', () => {
  it('trả về discriminated union và nhãn tiếng Việt tương ứng', () => {
    expect(getDeadlineInfo('2026-10-11', NOW)).toEqual({ kind: 'overdue', days: 2 })
    expect(formatDeadlineLabel({ kind: 'overdue', days: 2 })).toBe('Quá hạn 2 ngày')
    expect(formatDeadlineLabel({ kind: 'remaining', days: 0 })).toBe('Hạn hôm nay')
    expect(formatDeadlineLabel({ kind: 'remaining', days: 5 })).toBe('Còn 5 ngày')
  })
})

describe('calcStats', () => {
  it('trường hợp biên: danh sách rỗng cho toàn số 0, không chia cho 0', () => {
    expect(calcStats([], NOW)).toEqual({
      total: 0,
      completed: 0,
      incomplete: 0,
      overdue: 0,
      onTime: 0,
      completionRate: 0,
      byCourse: [],
    })
  })

  it('đếm đã xong, quá hạn, còn hạn và gom theo môn (môn nhiều bài lên trước)', () => {
    const items = [
      makeAssignment({ id: '1', course: 'Web', dueDate: '2026-10-01', completed: true }),
      makeAssignment({ id: '2', course: 'Web', dueDate: '2026-10-01' }),
      makeAssignment({ id: '3', course: 'Web', dueDate: '2026-10-20' }),
      makeAssignment({ id: '4', course: 'CSDL', dueDate: '2026-10-12' }),
    ]

    const stats = calcStats(items, NOW)

    expect(stats).toMatchObject({ total: 4, completed: 1, incomplete: 3, overdue: 2, onTime: 1, completionRate: 25 })
    expect(stats.byCourse).toEqual([
      { course: 'Web', total: 3, completed: 1, overdue: 1 },
      { course: 'CSDL', total: 1, completed: 0, overdue: 1 },
    ])
  })

  it('bài đã hoàn thành dù trễ hạn không bị tính là quá hạn', () => {
    const stats = calcStats([makeAssignment({ dueDate: '2026-01-01', completed: true })], NOW)
    expect(stats.overdue).toBe(0)
    expect(stats.completionRate).toBe(100)
  })
})

describe('lọc, tìm kiếm, ghim', () => {
  const items = [
    makeAssignment({ id: 'a', title: 'Bài lab định tuyến', course: 'Mạng máy tính', dueDate: '2026-10-20' }),
    makeAssignment({ id: 'b', title: 'Báo cáo nhóm', course: 'Cơ sở dữ liệu', dueDate: '2026-10-01' }),
    makeAssignment({ id: 'c', title: 'Đồ án nhỏ', course: 'Lập trình web nâng cao', completed: true }),
  ]

  it('filterAssignments chia theo trạng thái', () => {
    expect(filterAssignments(items, 'all', NOW)).toBe(items)
    expect(filterAssignments(items, 'incomplete', NOW).map((item) => item.id)).toEqual(['a', 'b'])
    expect(filterAssignments(items, 'completed', NOW).map((item) => item.id)).toEqual(['c'])
    expect(filterAssignments(items, 'overdue', NOW).map((item) => item.id)).toEqual(['b'])
  })

  it('searchAssignments không phân biệt dấu, hoa thường; từ khoá rỗng giữ nguyên mảng', () => {
    expect(normalizeText('  Đồ Án ')).toBe('do an')
    expect(searchAssignments(items, 'do an').map((item) => item.id)).toEqual(['c'])
    expect(searchAssignments(items, 'MẠNG').map((item) => item.id)).toEqual(['a'])
    expect(searchAssignments(items, '   ')).toBe(items)
  })

  it('sortPinnedFirst đưa bài ghim lên đầu, giữ thứ tự trong từng nhóm', () => {
    expect(sortPinnedFirst(items, ['c', 'b']).map((item) => item.id)).toEqual(['b', 'c', 'a'])
    expect(sortPinnedFirst(items, [])).toBe(items)
    expect(sortPinnedFirst(items, ['khong-ton-tai'])).toBe(items)
  })

  it('getNearestOpenAssignment bỏ qua bài đã xong và chọn hạn sớm nhất', () => {
    expect(getNearestOpenAssignment(items)?.id).toBe('b')
    expect(getNearestOpenAssignment([items[2]])).toBeUndefined()
  })
})

describe('định dạng', () => {
  it('formatCount dùng dấu chấm phân cách hàng nghìn, formatDueDate in dd/mm/yyyy', () => {
    expect(formatCount(10000)).toBe('10.000')
    expect(formatDueDate('2026-10-05')).toBe('05/10/2026')
  })
})
