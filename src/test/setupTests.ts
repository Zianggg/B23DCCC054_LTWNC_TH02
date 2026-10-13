import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { usePinStore } from '@/features/pins/usePinStore'

// jsdom không có matchMedia — ThemeProvider và useMediaQuery cần nó. Mặc định: màn hình hẹp, theme sáng.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Store Zustand là singleton của module: trả về trạng thái rỗng để các test không ảnh hưởng nhau.
// Unmount trước khi reset, nếu không component còn mount sẽ nhận cập nhật state ngoài act().
afterEach(() => {
  cleanup()
  usePinStore.setState({ pinnedIds: [] })
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})
