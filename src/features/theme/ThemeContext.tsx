import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

/** Context riêng cho theme — không gộp với state nào khác, để đổi theme chỉ báo cho đúng component dùng theme. */
const ThemeContext = createContext<ThemeContextValue | null>(null)

export const THEME_STORAGE_KEY = 'deadline-tracker-theme'

function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Trình duyệt chặn localStorage: dùng theo hệ điều hành.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => defaultTheme ?? readInitialTheme())

  // Đổi class trên <html> để CSS variables đổi màu; component không cần render lại để đổi màu.
  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Không lưu được thì lần sau dùng lại theme của hệ điều hành.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  // useMemo: object value chỉ đổi khi theme đổi. Provider có render lại vì lý do khác thì consumer cũng không render theo.
  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme phải được gọi bên trong <ThemeProvider>')
  }
  return context
}
