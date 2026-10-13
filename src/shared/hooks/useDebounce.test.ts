import { act, renderHook } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('trả giá trị ban đầu ngay, giá trị mới chỉ có sau đúng 300 ms', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'b' },
    })
    expect(result.current).toBe('b')

    rerender({ value: 'ba' })
    act(() => jest.advanceTimersByTime(299))
    expect(result.current).toBe('b')

    act(() => jest.advanceTimersByTime(1))
    expect(result.current).toBe('ba')
  })

  it('gõ liên tục thì timer đặt lại — chỉ giá trị cuối cùng được trả ra, một lần', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: '' },
    })

    for (const value of ['w', 'we', 'web']) {
      rerender({ value })
      act(() => jest.advanceTimersByTime(200))
      expect(result.current).toBe('')
    }

    act(() => jest.advanceTimersByTime(100))
    expect(result.current).toBe('web')
  })

  it('huỷ timer đang chờ khi unmount', () => {
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout')
    const { rerender, unmount } = renderHook(({ value }) => useDebounce(value), { initialProps: { value: 1 } })
    rerender({ value: 2 })
    clearTimeoutSpy.mockClear()

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1)
  })
})
