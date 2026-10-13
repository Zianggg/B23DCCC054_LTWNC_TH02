import { useEffect, useState } from 'react'

/**
 * Trả về `value` sau khi nó đứng yên `delay` ms.
 * Gõ liên tục thì timer bị huỷ và đặt lại, nên phần lọc phía sau chỉ chạy một lần khi người dùng ngừng gõ.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
