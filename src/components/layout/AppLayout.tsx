import { Outlet } from 'react-router'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

/**
 * Khung ứng dụng: sidebar bên trái, nội dung bên phải.
 * Từ lg: khung cao đúng một màn hình, danh sách lấp phần còn lại và tự cuộn bên trong (react-window cần chiều cao xác định).
 * Dưới lg: trang cuộn bình thường, danh sách có chiều cao cố định theo viewport.
 */
export function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider className="lg:h-svh">
        <AppSidebar />
        <SidebarInset className="lg:min-h-0 lg:overflow-hidden">
          <AppHeader />
          <div className="flex flex-col gap-4 p-4 md:p-6 lg:min-h-0 lg:flex-1">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
