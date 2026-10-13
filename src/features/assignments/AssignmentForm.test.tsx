import { screen } from '@testing-library/react'
import { makeAssignment, makeAssignmentsState } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'
import { AssignmentForm } from './AssignmentForm'

function setup(props: Parameters<typeof AssignmentForm>[0] = {}) {
  return renderWithProviders(<AssignmentForm {...props} />, {
    preloadedState: { assignments: makeAssignmentsState({ items: [makeAssignment({ id: 'cu', title: 'Bài cũ' })] }) },
  })
}

describe('AssignmentForm', () => {
  it('validate: gửi form trống hiện ba lỗi, đánh dấu ô sai và không thêm bài', async () => {
    const onSuccess = jest.fn()
    const { user, store } = setup({ onSuccess })

    await user.click(screen.getByRole('button', { name: 'Thêm bài tập' }))

    expect(screen.getByText('Nhập tên môn học.')).toBeInTheDocument()
    expect(screen.getByText('Nhập tên bài tập.')).toBeInTheDocument()
    expect(screen.getByText('Chọn hạn nộp.')).toBeInTheDocument()
    expect(screen.getByLabelText('Môn học')).toHaveAttribute('aria-invalid', 'true')
    expect(store.getState().assignments.items).toHaveLength(1)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('validate: chỉ gõ khoảng trắng vẫn bị coi là trống', async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText('Môn học'), '   ')
    await user.type(screen.getByLabelText('Tên bài tập'), 'Bài thực hành 02')
    await user.click(screen.getByRole('button', { name: 'Thêm bài tập' }))

    expect(screen.getByText('Nhập tên môn học.')).toBeInTheDocument()
    expect(screen.queryByText('Nhập tên bài tập.')).not.toBeInTheDocument()
  })

  it('submit: dữ liệu hợp lệ được thêm lên đầu store, đã trim, form reset và gọi onSuccess', async () => {
    const onSuccess = jest.fn()
    const { user, store } = setup({ onSuccess })

    await user.type(screen.getByLabelText('Môn học'), '  Cơ sở dữ liệu ')
    await user.type(screen.getByLabelText('Tên bài tập'), 'Báo cáo chuẩn hoá')
    await user.type(screen.getByLabelText('Hạn nộp'), '2026-10-30')
    await user.selectOptions(screen.getByLabelText('Mức ưu tiên'), 'high')
    await user.click(screen.getByRole('button', { name: 'Thêm bài tập' }))

    const [added, old] = store.getState().assignments.items
    expect(added).toMatchObject({
      course: 'Cơ sở dữ liệu',
      title: 'Báo cáo chuẩn hoá',
      dueDate: '2026-10-30',
      priority: 'high',
      completed: false,
    })
    expect(old.id).toBe('cu')
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Môn học')).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('nút Hủy gọi onCancel, không thêm bài', async () => {
    const onCancel = jest.fn()
    const { user, store } = setup({ onCancel })

    await user.type(screen.getByLabelText('Tên bài tập'), 'Nháp')
    await user.click(screen.getByRole('button', { name: 'Hủy' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(store.getState().assignments.items).toHaveLength(1)
  })
})
