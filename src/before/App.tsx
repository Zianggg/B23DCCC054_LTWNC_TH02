import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import StatsPage from '@/features/stats/StatsPage'
import { AssignmentsPage } from './AssignmentsPage'

/**
 * BẢN TRƯỚC TỐI ƯU — `npm run dev:before` / `npm run build:before`.
 * Import tĩnh trang Thống kê (không React.lazy) nên nó nằm luôn trong bundle đầu của trang Danh sách.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<AssignmentsPage />} />
        <Route path="thong-ke" element={<StatsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
