import { create } from 'zustand'

/**
 * Ghim bài tập — state giao diện thuần tuý, không cần time-travel hay middleware,
 * nên để trong Zustand thay vì thêm một slice Redux.
 */
interface PinState {
  pinnedIds: string[]
  togglePin: (id: string) => void
  /**
   * Đọc trạng thái tại thời điểm gọi (trong event handler, test).
   * Khi render, hãy subscribe `pinnedIds` — hàm này không đổi tham chiếu nên không kích hoạt re-render.
   */
  isPinned: (id: string) => boolean
}

export const usePinStore = create<PinState>()((set, get) => ({
  pinnedIds: [],
  togglePin: (id) =>
    set((state) => ({
      pinnedIds: state.pinnedIds.includes(id)
        ? state.pinnedIds.filter((pinnedId) => pinnedId !== id)
        : [...state.pinnedIds, id],
    })),
  isPinned: (id) => get().pinnedIds.includes(id),
}))
