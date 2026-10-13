import { setupStore } from '@/app/store'
import { makeAssignment, makeAssignmentsState } from '@/test/fixtures'
import { fetchAssignmentsApi } from './assignmentsApi'
import reducer, {
  addAssignment,
  fetchAssignments,
  initialState,
  removeAssignment,
  seedAssignments,
  setFilter,
  toggleComplete,
} from './assignmentsSlice'

jest.mock('./assignmentsApi', () => ({ fetchAssignmentsApi: jest.fn() }))

const mockedFetch = jest.mocked(fetchAssignmentsApi)

describe('assignmentsSlice reducer', () => {
  it('trả về initialState khi gặp action lạ', () => {
    expect(reducer(undefined, { type: 'khong-ai-xu-ly' })).toEqual(initialState)
  })

  it('addAssignment thêm bài mới lên đầu, tự sinh id và completed = false', () => {
    const state = makeAssignmentsState({ items: [makeAssignment({ id: 'cu' })] })

    const next = reducer(
      state,
      addAssignment({ course: 'Toán rời rạc', title: 'Bài tập chương 5', dueDate: '2026-10-20', priority: 'low' }),
    )

    expect(next.items).toHaveLength(2)
    expect(next.items[0]).toMatchObject({ title: 'Bài tập chương 5', completed: false })
    expect(next.items[0].id).toEqual(expect.any(String))
    expect(next.items[0].id).not.toBe('cu')
    expect(next.items[1].id).toBe('cu')
  })

  it('toggleComplete đảo trạng thái hoàn thành, gọi lần hai thì trở lại như cũ', () => {
    const state = makeAssignmentsState({ items: [makeAssignment({ id: 'x' })] })

    const done = reducer(state, toggleComplete('x'))
    expect(done.items[0].completed).toBe(true)
    expect(reducer(done, toggleComplete('x')).items[0].completed).toBe(false)
  })

  it('trường hợp biên: toggle hoặc xoá id không tồn tại giữ nguyên state (cùng tham chiếu)', () => {
    const state = makeAssignmentsState({ items: [makeAssignment({ id: 'x' })] })

    expect(reducer(state, toggleComplete('khong-co'))).toBe(state)
    expect(reducer(state, removeAssignment('khong-co'))).toBe(state)
  })

  it('removeAssignment xoá đúng bài, xoá trên danh sách rỗng không lỗi', () => {
    const state = makeAssignmentsState({ items: [makeAssignment({ id: 'x' }), makeAssignment({ id: 'y' })] })

    expect(reducer(state, removeAssignment('x')).items.map((item) => item.id)).toEqual(['y'])
    expect(reducer(makeAssignmentsState(), removeAssignment('x')).items).toEqual([])
  })

  it('setFilter đổi bộ lọc', () => {
    expect(reducer(initialState, setFilter('overdue')).filter).toBe('overdue')
  })

  it('seedAssignments thay toàn bộ danh sách bằng N bài sinh sẵn và xoá lỗi cũ', () => {
    const state = makeAssignmentsState({ status: 'failed', error: 'Lỗi cũ', items: [makeAssignment()] })

    const next = reducer(state, seedAssignments(10_000))

    expect(next.items).toHaveLength(10_000)
    expect(next.status).toBe('succeeded')
    expect(next.error).toBeNull()
  })

  it('fetchAssignments: pending → loading, fulfilled → succeeded kèm dữ liệu', () => {
    const items = [makeAssignment()]
    const loading = reducer(makeAssignmentsState({ status: 'failed', error: 'x' }), { type: fetchAssignments.pending.type })
    expect(loading).toMatchObject({ status: 'loading', error: null })

    const loaded = reducer(loading, { type: fetchAssignments.fulfilled.type, payload: items })
    expect(loaded).toMatchObject({ status: 'succeeded', items })
  })

  it('fetchAssignments rejected: lưu thông báo lỗi, không có thì dùng câu mặc định', () => {
    const failed = reducer(initialState, { type: fetchAssignments.rejected.type, error: { message: 'Mất kết nối' } })
    expect(failed).toMatchObject({ status: 'failed', error: 'Mất kết nối' })

    const noMessage = reducer(initialState, { type: fetchAssignments.rejected.type, error: {} })
    expect(noMessage.error).toBe('Không tải được danh sách bài tập.')
  })
})

describe('fetchAssignments thunk', () => {
  it('gọi API và đưa dữ liệu vào store', async () => {
    const items = [makeAssignment({ id: 'api-1' })]
    mockedFetch.mockResolvedValue({ statusCode: 200, message: 'ok', data: { items, page: 1, total: 1 } })
    const store = setupStore()

    await store.dispatch(fetchAssignments())

    expect(store.getState().assignments).toMatchObject({ status: 'succeeded', items })
  })

  it('bỏ qua lần gọi thứ hai khi lần đầu đang tải (condition)', async () => {
    mockedFetch.mockResolvedValue({ statusCode: 200, message: 'ok', data: { items: [], page: 1, total: 0 } })
    const store = setupStore()

    const first = store.dispatch(fetchAssignments())
    const second = await store.dispatch(fetchAssignments())
    await first

    expect(mockedFetch).toHaveBeenCalledTimes(1)
    expect(fetchAssignments.rejected.match(second) && second.meta.condition).toBe(true)
  })
})
