import { createAsyncThunk, createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'
import type { Assignment, AssignmentFilter, AsyncStatus, CreateAssignmentDto } from '@/types'
import { fetchAssignmentsApi } from './assignmentsApi'
import { generateAssignments } from './stressData'

export interface AssignmentsState {
  items: Assignment[]
  status: AsyncStatus
  error: string | null
  filter: AssignmentFilter
}

export const initialState: AssignmentsState = {
  items: [],
  status: 'idle',
  error: null,
  filter: 'all',
}

/**
 * createAsyncThunk<ReturnType, ArgType, ThunkApiConfig> — slide Buổi 3.
 * condition: StrictMode chạy effect hai lần lúc mount; lần gọi thứ hai bị huỷ khi đang tải.
 */
export const fetchAssignments = createAsyncThunk<Assignment[], void, { state: { assignments: AssignmentsState } }>(
  'assignments/fetchAll',
  async () => {
    const response = await fetchAssignmentsApi()
    return response.data.items
  },
  {
    condition: (_, { getState }) => getState().assignments.status !== 'loading',
  },
)

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    addAssignment: {
      reducer(state, action: PayloadAction<Assignment>) {
        state.items.unshift(action.payload)
      },
      // Sinh id ở prepare để reducer vẫn là hàm thuần.
      prepare(dto: CreateAssignmentDto) {
        return { payload: { ...dto, id: nanoid(), completed: false } }
      },
    },
    toggleComplete(state, action: PayloadAction<string>) {
      const found = state.items.find((item) => item.id === action.payload)
      if (found) {
        found.completed = !found.completed
      }
    },
    removeAssignment(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((item) => item.id === action.payload)
      if (index !== -1) {
        state.items.splice(index, 1)
      }
    },
    setFilter(state, action: PayloadAction<AssignmentFilter>) {
      state.filter = action.payload
    },
    /** Stress test: thay toàn bộ danh sách bằng `count` bài sinh sẵn. */
    seedAssignments: {
      reducer(state, action: PayloadAction<Assignment[]>) {
        state.items = action.payload
        state.status = 'succeeded'
        state.error = null
      },
      prepare(count: number) {
        return { payload: generateAssignments(count) }
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message ?? 'Không tải được danh sách bài tập.'
      })
  },
})

export const { addAssignment, toggleComplete, removeAssignment, setFilter, seedAssignments } = assignmentsSlice.actions
export default assignmentsSlice.reducer
