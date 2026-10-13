import { act, screen, within } from '@testing-library/react'
import { usePinStore } from '@/features/pins/usePinStore'
import { isoDaysFromToday, makeAssignment, makeAssignmentsState } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { ApiResponse, Assignment, Paginated } from '@/types'
import { AssignmentList } from './AssignmentList'
import { fetchAssignmentsApi } from './assignmentsApi'

jest.mock('./assignmentsApi', () => ({ fetchAssignmentsApi: jest.fn() }))

const mockedFetch = jest.mocked(fetchAssignmentsApi)

const SAMPLE: Assignment[] = [
  makeAssignment({ id: 'web', title: 'Bài thực hành 02', course: 'Lập trình web nâng cao', dueDate: isoDaysFromToday(4) }),
  makeAssignment({ id: 'db', title: 'Báo cáo lược đồ', course: 'Cơ sở dữ liệu', dueDate: isoDaysFromToday(-2) }),
  makeAssignment({ id: 'net', title: 'Bài lab định tuyến', course: 'Mạng máy tính', dueDate: isoDaysFromToday(1) }),
]

function apiResponse(items: Assignment[]): ApiResponse<Paginated<Assignment>> {
  return { statusCode: 200, message: 'ok', data: { items, page: 1, total: items.length } }
}

/** Promise tự điều khiển: giữ API ở trạng thái "đang chờ" cho tới khi test gọi resolve/reject. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function visibleTitles() {
  return within(screen.getByRole('list', { name: 'Danh sách bài tập' }))
    .getAllByRole('heading')
    .map((heading) => heading.textContent)
}

describe('AssignmentList với API mock', () => {
  it('hiện trạng thái đang tải, sau đó hiện danh sách khi API trả về thành công', async () => {
    const request = deferred<ApiResponse<Paginated<Assignment>>>()
    mockedFetch.mockReturnValue(request.promise)

    const { store } = renderWithProviders(<AssignmentList />, { preloadedState: { assignments: makeAssignmentsState({ status: 'idle' }) } })

    expect(screen.getByRole('status', { name: 'Đang tải danh sách bài tập' })).toBeInTheDocument()
    expect(store.getState().assignments.status).toBe('loading')
    expect(mockedFetch).toHaveBeenCalledTimes(1)

    await act(async () => request.resolve(apiResponse(SAMPLE)))

    expect(screen.queryByRole('status', { name: 'Đang tải danh sách bài tập' })).not.toBeInTheDocument()
    expect(visibleTitles()).toEqual(['Bài thực hành 02', 'Báo cáo lược đồ', 'Bài lab định tuyến'])
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === '3 bài tập')).toBeVisible()
  })

  it('API lỗi thì hiện thông báo kèm nút Tải lại; tải lại thành công thì hiện danh sách', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Mất kết nối tới máy chủ'))

    const { user } = renderWithProviders(<AssignmentList />, {
      preloadedState: { assignments: makeAssignmentsState({ status: 'idle' }) },
    })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Không tải được danh sách bài tập')
    expect(alert).toHaveTextContent('Mất kết nối tới máy chủ')

    mockedFetch.mockResolvedValueOnce(apiResponse(SAMPLE))
    await user.click(within(alert).getByRole('button', { name: 'Tải lại' }))

    expect(await screen.findByRole('heading', { name: 'Bài thực hành 02' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(mockedFetch).toHaveBeenCalledTimes(2)
  })

  it('bài đã ghim luôn nằm đầu danh sách, bỏ ghim thì về chỗ cũ', async () => {
    const { user } = renderWithProviders(<AssignmentList />, {
      preloadedState: { assignments: makeAssignmentsState({ items: SAMPLE }) },
    })

    await user.click(screen.getByRole('button', { name: 'Ghim Bài lab định tuyến' }))

    expect(usePinStore.getState().isPinned('net')).toBe(true)
    expect(visibleTitles()[0]).toBe('Bài lab định tuyến')
    expect(screen.getByText('1 bài đang ghim')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Bỏ ghim Bài lab định tuyến' }))
    expect(visibleTitles()).toEqual(['Bài thực hành 02', 'Báo cáo lược đồ', 'Bài lab định tuyến'])
  })

  it('hoàn thành và xoá bài qua handler truyền xuống AssignmentCard', async () => {
    const { user, store } = renderWithProviders(<AssignmentList />, {
      preloadedState: { assignments: makeAssignmentsState({ items: SAMPLE }) },
    })

    await user.click(screen.getByRole('button', { name: 'Đánh dấu hoàn thành Báo cáo lược đồ' }))
    expect(store.getState().assignments.items.find((item) => item.id === 'db')?.completed).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Xóa Bài thực hành 02' }))
    expect(visibleTitles()).toEqual(['Báo cáo lược đồ', 'Bài lab định tuyến'])
  })

  it('lọc + từ khoá không khớp thì hiện trạng thái rỗng có hướng dẫn', () => {
    renderWithProviders(<AssignmentList keyword="vật lý" />, {
      preloadedState: { assignments: makeAssignmentsState({ items: SAMPLE }) },
    })
    expect(screen.getByText('Không có bài nào khớp “vật lý”')).toBeInTheDocument()
  })

  it('bộ lọc không có bài nào thì gợi ý chọn bộ lọc khác', () => {
    renderWithProviders(<AssignmentList />, {
      preloadedState: { assignments: makeAssignmentsState({ items: SAMPLE, filter: 'completed' }) },
    })
    expect(screen.getByText('Không có bài ở mục Đã hoàn thành')).toBeInTheDocument()
  })

  it('10.000 bài chỉ render số dòng vừa khung nhìn (virtualization)', () => {
    const many = Array.from({ length: 10_000 }, (_, index) =>
      makeAssignment({ id: `s-${index}`, title: `Bài số ${index + 1}`, dueDate: isoDaysFromToday(index % 30) }),
    )
    renderWithProviders(<AssignmentList />, { preloadedState: { assignments: makeAssignmentsState({ items: many }) } })

    expect(screen.getByText('10.000')).toBeInTheDocument()
    expect(screen.getAllByRole('article').length).toBeLessThan(20)
  })
})
