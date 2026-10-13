import { useMatch } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/features/theme/ThemeToggle'

const longDate = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Thanh trên cùng: mở/đóng sidebar, breadcrumb của trang hiện tại, ngày hôm nay và nút đổi theme. */
export function AppHeader() {
  const onStats = useMatch('/thong-ke') !== null

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb aria-label="Vị trí trang">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">Deadline Tracker</BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{onStats ? 'Thống kê' : 'Danh sách bài tập'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground first-letter:uppercase sm:inline">
          {longDate.format(new Date())}
        </span>
        <ThemeToggle />
      </div>
    </header>
  )
}
