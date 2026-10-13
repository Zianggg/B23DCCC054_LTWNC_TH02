import type { Assignment, Priority } from '@/types'

/** Số bài của chế độ stress test (nút "Tạo 10.000 bài tập mẫu" và ?stress trên URL). */
export const STRESS_TEST_SIZE = 10_000

const COURSES = [
  'Lập trình web nâng cao',
  'Cơ sở dữ liệu',
  'Mạng máy tính',
  'Toán rời rạc',
  'Hệ điều hành',
  'Kiến trúc máy tính',
  'Trí tuệ nhân tạo',
  'Tiếng Anh chuyên ngành',
]

const KINDS = ['Bài tập về nhà', 'Bài thực hành', 'Bài lab', 'Báo cáo nhóm', 'Đồ án nhỏ', 'Bài kiểm tra']

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Hàm sinh dữ liệu cho stress test.
 * Hạn nộp trải từ 30 ngày trước tới 59 ngày sau `now`, 1/5 số bài đã hoàn thành.
 * Cùng `count` và cùng ngày thì cùng dữ liệu, id cố định nên bài đã ghim vẫn giữ sau khi sinh lại.
 */
export function generateAssignments(count: number, now: Date = new Date()): Assignment[] {
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  return Array.from({ length: count }, (_, index) => ({
    id: `stress-${index + 1}`,
    course: COURSES[index % COURSES.length],
    title: `${KINDS[index % KINDS.length]} số ${index + 1}`,
    dueDate: toIsoDate(new Date(year, month, day + (index % 90) - 30)),
    priority: PRIORITIES[index % PRIORITIES.length],
    completed: index % 5 === 0,
  }))
}

/**
 * ?stress hoặc ?stress=N trên URL: mở trang với sẵn N bài (mặc định 10.000).
 * Lighthouse tải lại trang trước khi đo nên không bấm nút được — tham số này giúp đo đúng trang 10.000 bài.
 */
export function readStressCount(search: string): number {
  const params = new URLSearchParams(search)
  if (!params.has('stress')) return 0
  const value = Number(params.get('stress'))
  return Number.isInteger(value) && value > 0 ? Math.min(value, 100_000) : STRESS_TEST_SIZE
}
