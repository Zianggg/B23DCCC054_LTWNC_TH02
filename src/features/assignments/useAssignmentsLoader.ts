import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchAssignments, seedAssignments } from './assignmentsSlice'
import { readStressCount } from './stressData'

/**
 * Nạp dữ liệu lần đầu cho trang nào cần danh sách (Danh sách, Thống kê).
 * Có ?stress trên URL thì sinh sẵn bài mẫu thay vì gọi API.
 */
export function useAssignmentsLoader() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.assignments.status)

  useEffect(() => {
    if (status !== 'idle') return
    const stressCount = readStressCount(window.location.search)
    if (stressCount > 0) {
      dispatch(seedAssignments(stressCount))
    } else {
      void dispatch(fetchAssignments())
    }
  }, [dispatch, status])

  return status
}
