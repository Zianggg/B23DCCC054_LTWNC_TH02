import { MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from './ThemeContext'

/** Consumer duy nhất của ThemeContext — khi đổi theme, Profiler chỉ thấy ThemeProvider và nút này render lại. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextLabel = theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'

  return (
    <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label={nextLabel} title={nextLabel}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
