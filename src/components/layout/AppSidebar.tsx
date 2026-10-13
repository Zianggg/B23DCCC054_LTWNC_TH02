import { NavLink, useMatch } from 'react-router'
import { CalendarClockIcon, ChartColumnIcon, ListTodoIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { loadStatsPage } from '@/features/stats/loadStatsPage'

/** Tải trước chunk Thống kê khi người dùng có ý định mở (rê chuột hoặc Tab tới link). */
function preloadStats() {
  void loadStatsPage()
}

export function AppSidebar() {
  const onList = useMatch({ path: '/', end: true }) !== null
  const onStats = useMatch('/thong-ke') !== null

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <CalendarClockIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Deadline Tracker</span>
                  <span className="truncate text-xs text-muted-foreground">Lập trình web nâng cao</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Theo dõi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={onList} tooltip="Danh sách bài tập">
                  <NavLink to="/" end>
                    <ListTodoIcon />
                    <span>Danh sách bài tập</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={onStats} tooltip="Thống kê">
                  <NavLink to="/thong-ke" onMouseEnter={preloadStats} onFocus={preloadStats}>
                    <ChartColumnIcon />
                    <span>Thống kê</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent active:bg-transparent">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">SV</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">B23DCCC054</span>
                <span className="truncate text-xs text-muted-foreground">Sinh viên</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
