import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AssignmentsPage } from '@/features/assignments/AssignmentsPage'
import { loadStatsPage } from '@/features/stats/loadStatsPage'
import { StatsPageSkeleton } from '@/features/stats/StatsPageSkeleton'

/** Code-splitting: trang Thống kê là chunk riêng, trang Danh sách không phải tải phần này. */
const StatsPage = lazy(loadStatsPage)

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<AssignmentsPage />} />
        <Route
          path="thong-ke"
          element={
            <Suspense fallback={<StatsPageSkeleton />}>
              <StatsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
