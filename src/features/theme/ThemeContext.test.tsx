import { Profiler } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from './ThemeContext'
import { ThemeToggle } from './ThemeToggle'

function Unrelated() {
  return <p>Danh sách bài tập</p>
}

describe('ThemeContext', () => {
  it('nút đổi theme bật/tắt class "dark" trên <html> và lưu lựa chọn', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    await user.click(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('đổi theme không render lại component không dùng theme (đo bằng <Profiler>)', async () => {
    const user = userEvent.setup()
    const onRender = jest.fn()
    render(
      <ThemeProvider defaultTheme="light">
        <Profiler id="khong-lien-quan" onRender={onRender}>
          <Unrelated />
        </Profiler>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(onRender).toHaveBeenCalledTimes(1)
    expect(onRender.mock.calls[0][1]).toBe('mount')

    await user.click(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' }))
    await user.click(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' }))

    expect(onRender).toHaveBeenCalledTimes(1)
  })

  it('lấy theme đã lưu, nếu chưa lưu thì theo hệ điều hành', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const { unmount } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })).toBeInTheDocument()
    unmount()

    localStorage.clear()
    const matchMedia = jest.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('useTheme bên ngoài ThemeProvider báo lỗi rõ ràng', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    function Orphan() {
      useTheme()
      return null
    }
    expect(() => render(<Orphan />)).toThrow('useTheme phải được gọi bên trong <ThemeProvider>')
  })
})
