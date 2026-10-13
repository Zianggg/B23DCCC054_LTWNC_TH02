import { act } from '@testing-library/react'
import { usePinStore } from './usePinStore'

describe('usePinStore (Zustand)', () => {
  it('togglePin ghim rồi bỏ ghim, isPinned đọc đúng trạng thái hiện tại', () => {
    const { togglePin, isPinned } = usePinStore.getState()

    act(() => togglePin('asg-01'))
    expect(usePinStore.getState().pinnedIds).toEqual(['asg-01'])
    expect(isPinned('asg-01')).toBe(true)

    act(() => togglePin('asg-01'))
    expect(usePinStore.getState().pinnedIds).toEqual([])
    expect(isPinned('asg-01')).toBe(false)
  })

  it('giữ thứ tự ghim và chỉ bỏ đúng bài được chọn', () => {
    const { togglePin } = usePinStore.getState()

    act(() => {
      togglePin('a')
      togglePin('b')
      togglePin('c')
      togglePin('b')
    })

    expect(usePinStore.getState().pinnedIds).toEqual(['a', 'c'])
  })
})
