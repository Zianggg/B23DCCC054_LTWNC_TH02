import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { isoDaysFromToday, makeAssignment, makeAssignmentsState } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { Assignment } from '@/types'
import StatsPage from './StatsPage'

jest.mock('@/features/assignments/assignmentsApi', () => ({ fetchAssignmentsApi: jest.fn() }))

function renderStats(items: Assignment[]) {
  return renderWithProviders(
    <Routes>
      <Route path="/thong-ke" element={<StatsPage />} />
      <Route path="/" element={<p>Trang danh sách</p>} />
    </Routes>,
    { route: '/thong-ke', preloadedState: { assignments: makeAssignmentsState({ items }) } },
  )
}

const ITEMS = [
  makeAssignment({ id: '1', course: 'Lập trình web nâng cao', dueDate: isoDaysFromToday(-3), completed: true }),
  makeAssignment({ id: '2', course: 'Lập trình web nâng cao', dueDate: isoDaysFromToday(-1), title: 'Bài trễ' }),
  makeAssignment({ id: '3', course: 'Lập trình web nâng cao', dueDate: isoDaysFromToday(5) }),
  makeAssignment({ id: '4', course: 'Cơ sở dữ liệu', dueDate: isoDaysFromToday(2) }),
]

describe('StatsPage', () => {
  it('đếm số bài đã xong, quá hạn, còn hạn và tỉ lệ hoàn thành', () => {
    renderStats(ITEMS)

    expect(screen.getByText('hoàn thành, 1 trên 4 bài')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Đã hoàn thành\s*1$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Còn hạn\s*2$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Quá hạn\s*1$/ })).toBeInTheDocument()
    expect(screen.getByText('Bài trễ')).toBeInTheDocument()
  })

  it('bảng theo môn: môn nhiều bài lên trước, có tổng, đã xong, quá hạn và tiến độ', () => {
    renderStats(ITEMS)

    const rows = screen.getAllByRole('row').slice(1)
    expect(within(rows[0]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Lập trình web nâng cao',
      '3',
      '1',
      '1',
      '33%',
    ])
    expect(within(rows[1]).getByRole('progressbar', { name: 'Tiến độ Cơ sở dữ liệu' })).toBeInTheDocument()
  })

  it('bấm mục Quá hạn chuyển sang trang danh sách với bộ lọc tương ứng', async () => {
    const { user, store } = renderStats(ITEMS)

    await user.click(screen.getByRole('button', { name: /^Quá hạn\s*1$/ }))

    expect(store.getState().assignments.filter).toBe('overdue')
    expect(screen.getByText('Trang danh sách')).toBeInTheDocument()
  })

  it('chưa có bài nào thì hiện hướng dẫn thay cho số 0%', () => {
    renderStats([])
    expect(screen.getByText('Chưa có bài tập để thống kê')).toBeInTheDocument()
  })
})
