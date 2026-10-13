import { useCallback, useSyncExternalStore } from 'react'

/** Chỉ render lại khi kết quả media query đổi (true/false), không render theo từng pixel khi kéo cửa sổ. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
