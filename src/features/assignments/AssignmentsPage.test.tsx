import { act, screen, within } from '@testing-library/react'
import { isoDaysFromToday, makeAssignment, makeAssignmentsState } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { AssignmentsPage, SEARCH_DEBOUNCE_MS } from './AssignmentsPage'

jest.mock('./assignmentsApi', () => ({ fetchAssignmentsApi: jest.fn() }))

const ITEMS = [
  makeAssignment({ id: 'web', title: 'Bài thực hành 02', course: 'Lập trình web nâng cao', dueDate: isoDaysFromToday(4) }),
  makeAssignment({ id: 'db', title: 'Báo cáo lược đồ', course: 'Cơ sở dữ liệu', dueDate: isoDaysFromToday(-2) }),
  makeAssignment({ id: 'net', title: 'Bài lab định tuyến', course: 'Mạng máy tính', dueDate: isoDaysFromToday(1), completed: true }),
]

function renderPage() {
  return renderWithProviders(<AssignmentsPage />, {
    preloadedState: { assignments: makeAssignmentsState({ items: ITEMS }) },
    userEventOptions: { advanceTimers: jest.advanceTimersByTime },
  })
}

function titles() {
  return within(screen.getByRole('list', { name: 'Danh sách bài tập' }))
    .getAllByRole('heading')
    .map((heading) => heading.textContent)
}

describe('AssignmentsPage', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('ô tìm kiếm debounce 300 ms: danh sách chỉ lọc sau khi ngừng gõ', async () => {
    const { user } = renderPage()
    const search = screen.getByRole('searchbox', { name: 'Tìm bài tập' })

    await user.type(search, 'mang')
    expect(search).toHaveValue('mang')
    expect(titles()).toHaveLength(3)

    act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS))
    expect(titles()).toEqual(['Bài lab định tuyến'])

    await user.click(screen.getByRole('button', { name: 'Xóa từ khoá' }))
    act(() => jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS))
    expect(titles()).toHaveLength(3)
  })

  it('tab lọc hiện số lượng và đổi bộ lọc trong store', async () => {
    const { user, store } = renderPage()

    expect(screen.getByRole('tab', { name: 'Quá hạn 1' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Đã hoàn thành/ }))

    expect(store.getState().assignments.filter).toBe('completed')
    expect(titles()).toEqual(['Bài lab định tuyến'])
  })

  it('nút "Tạo 10.000 bài tập mẫu" thay danh sách bằng 10.000 bài', async () => {
    const { user, store } = renderPage()

    await user.click(screen.getByRole('button', { name: 'Tạo 10.000 bài tập mẫu' }))

    expect(store.getState().assignments.items).toHaveLength(10_000)
    expect(screen.getByRole('tab', { name: /Tất cả/ })).toHaveTextContent('10.000')
  })

  it('dialog Thêm bài tập: thêm thành công thì bài mới nằm đầu danh sách và dialog đóng', async () => {
    const { user } = renderPage()

    await user.click(screen.getByRole('button', { name: 'Thêm bài tập' }))
    const dialog = screen.getByRole('dialog', { name: 'Thêm bài tập' })
    await user.type(within(dialog).getByLabelText('Môn học'), 'Hệ điều hành')
    await user.type(within(dialog).getByLabelText('Tên bài tập'), 'Bài tập lập lịch CPU')
    await user.type(within(dialog).getByLabelText('Hạn nộp'), isoDaysFromToday(3))
    await user.click(within(dialog).getByRole('button', { name: 'Thêm bài tập' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(titles()[0]).toBe('Bài tập lập lịch CPU')
  })
})
