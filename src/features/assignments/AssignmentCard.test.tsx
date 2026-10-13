import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { isoDaysFromToday, makeAssignment } from '@/test/fixtures'
import type { Assignment } from '@/types'
import { AssignmentCard } from './AssignmentCard'
import { formatDueDate } from './assignmentUtils'

function renderCard(overrides: Partial<Assignment> = {}, pinned = false) {
  const assignment = makeAssignment({ id: 'asg-7', dueDate: isoDaysFromToday(4), ...overrides })
  const handlers = {
    onToggleComplete: jest.fn(),
    onTogglePin: jest.fn(),
    onRemove: jest.fn(),
  }
  render(<AssignmentCard assignment={assignment} pinned={pinned} {...handlers} />)
  return { assignment, user: userEvent.setup(), ...handlers }
}

describe('AssignmentCard', () => {
  it('hiển thị tên bài, môn, mức ưu tiên, hạn nộp và số ngày còn lại', () => {
    const { assignment } = renderCard({ title: 'Bài lab 03: định tuyến tĩnh', course: 'Mạng máy tính', priority: 'high' })

    expect(screen.getByRole('heading', { name: 'Bài lab 03: định tuyến tĩnh' })).toBeInTheDocument()
    expect(screen.getByText('Mạng máy tính')).toBeInTheDocument()
    expect(screen.getByText('Cao')).toBeInTheDocument()
    expect(screen.getByText(formatDueDate(assignment.dueDate))).toHaveAttribute('datetime', assignment.dueDate)
    expect(screen.getByRole('article')).toHaveTextContent('Còn 4 ngày')
  })

  it('bài quá hạn hiện số ngày trễ, bài đã xong hiện "Đã xong" và gạch tên', () => {
    renderCard({ id: 'late', title: 'Bài trễ', dueDate: isoDaysFromToday(-2) })
    expect(screen.getByRole('article', { name: 'Bài trễ' })).toHaveTextContent('Quá hạn 2 ngày')

    renderCard({ id: 'done', title: 'Bài xong', completed: true })
    const done = screen.getByRole('article', { name: 'Bài xong' })
    expect(done).toHaveTextContent('Đã xong')
    expect(screen.getByRole('heading', { name: 'Bài xong' })).toHaveClass('line-through')
  })

  it('nút hoàn thành gọi onToggleComplete với id của bài', async () => {
    const { user, onToggleComplete, onRemove } = renderCard({ title: 'Báo cáo nhóm' })

    await user.click(screen.getByRole('button', { name: 'Đánh dấu hoàn thành Báo cáo nhóm' }))

    expect(onToggleComplete).toHaveBeenCalledTimes(1)
    expect(onToggleComplete).toHaveBeenCalledWith('asg-7')
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('bài đã xong đổi nút thành "Mở lại"', async () => {
    const { user, onToggleComplete } = renderCard({ title: 'Báo cáo nhóm', completed: true })

    await user.click(screen.getByRole('button', { name: 'Mở lại Báo cáo nhóm' }))

    expect(onToggleComplete).toHaveBeenCalledWith('asg-7')
  })

  it('nút ghim gọi onTogglePin và aria-pressed phản ánh trạng thái ghim', async () => {
    const { user, onTogglePin } = renderCard({ title: 'Đồ án nhỏ' })
    const pin = screen.getByRole('button', { name: 'Ghim Đồ án nhỏ' })
    expect(pin).toHaveAttribute('aria-pressed', 'false')

    await user.click(pin)
    expect(onTogglePin).toHaveBeenCalledWith('asg-7')

    renderCard({ id: 'pinned', title: 'Bài đã ghim' }, true)
    expect(screen.getByRole('button', { name: 'Bỏ ghim Bài đã ghim' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('nút xoá gọi onRemove với id của bài', async () => {
    const { user, onRemove } = renderCard({ title: 'Bài luận' })

    await user.click(screen.getByRole('button', { name: 'Xóa Bài luận' }))

    expect(onRemove).toHaveBeenCalledWith('asg-7')
  })
})
