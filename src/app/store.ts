import { combineReducers, configureStore, type Middleware } from '@reduxjs/toolkit'
import { createLogger } from 'redux-logger'
import assignmentsReducer from '@/features/assignments/assignmentsSlice'

const rootReducer = combineReducers({
  assignments: assignmentsReducer,
})

export type RootState = ReturnType<typeof rootReducer>

/**
 * Vite thay process.env.NODE_ENV bằng hằng số: "development" khi `npm run dev`, "production" khi build.
 * Jest chạy với NODE_ENV = "test", nên test không in log.
 */
const isDevelopment = process.env.NODE_ENV === 'development'

function devOnlyMiddleware(): Middleware[] {
  if (!isDevelopment) return []
  return [
    createLogger({
      collapsed: true,
      duration: true,
      // Stress test chứa 10.000 bài: in cả state trước/sau vẫn nhẹ vì console chỉ giữ tham chiếu.
    }),
  ]
}

/** Tạo store mới — app dùng một instance, mỗi test tạo một instance riêng (có thể kèm preloadedState). */
export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(devOnlyMiddleware()),
  })
}

export const store = setupStore()

export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
