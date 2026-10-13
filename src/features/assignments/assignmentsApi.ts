import type { ApiResponse, Assignment, Paginated } from '@/types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function daysFromToday(offset: number, now: Date): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Hạn nộp tính theo ngày mở app, nên lúc nào cũng có đủ bài quá hạn, sắp hạn và còn xa. */
export function createSampleAssignments(now: Date = new Date()): Assignment[] {
  return [
    {
      id: 'asg-01',
      course: 'Lập trình web nâng cao',
      title: 'Bài thực hành 02: nâng cấp Student Deadline Tracker',
      dueDate: daysFromToday(4, now),
      priority: 'high',
      completed: false,
    },
    {
      id: 'asg-02',
      course: 'Cơ sở dữ liệu',
      title: 'Báo cáo nhóm: thiết kế lược đồ quan hệ',
      dueDate: daysFromToday(-2, now),
      priority: 'high',
      completed: false,
    },
    {
      id: 'asg-03',
      course: 'Mạng máy tính',
      title: 'Bài lab 03: định tuyến tĩnh',
      dueDate: daysFromToday(1, now),
      priority: 'medium',
      completed: false,
    },
    {
      id: 'asg-04',
      course: 'Toán rời rạc',
      title: 'Bài tập chương 4: quan hệ và hàm',
      dueDate: daysFromToday(-6, now),
      priority: 'low',
      completed: true,
    },
    {
      id: 'asg-05',
      course: 'Lập trình web nâng cao',
      title: 'Ôn tập: Zustand, Context và Redux middleware',
      dueDate: daysFromToday(9, now),
      priority: 'medium',
      completed: false,
    },
    {
      id: 'asg-06',
      course: 'Tiếng Anh chuyên ngành',
      title: 'Bài luận 400 từ: đạo văn học thuật',
      dueDate: daysFromToday(-1, now),
      priority: 'low',
      completed: false,
    },
  ]
}

/**
 * API giả lập — khi khởi động app lấy danh sách mẫu.
 * Trả về đúng generic ApiResponse<Paginated<Assignment>> như slide Buổi 1.
 */
export async function fetchAssignmentsApi(): Promise<ApiResponse<Paginated<Assignment>>> {
  await delay(650)
  const items = createSampleAssignments()
  return {
    statusCode: 200,
    message: 'Lấy danh sách bài tập mẫu thành công',
    data: { items, page: 1, total: items.length },
  }
}
