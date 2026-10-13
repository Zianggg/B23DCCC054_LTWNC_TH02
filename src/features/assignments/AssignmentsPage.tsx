import { useState } from 'react'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { AssignmentList } from './AssignmentList'
import { AssignmentsToolbar } from './AssignmentsToolbar'

/** Ô tìm kiếm cập nhật ngay theo phím gõ; danh sách chỉ nhận từ khoá sau khi ngừng gõ 300 ms. */
export const SEARCH_DEBOUNCE_MS = 300

export function AssignmentsPage() {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, SEARCH_DEBOUNCE_MS)

  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      <AssignmentsToolbar keyword={keyword} onKeywordChange={setKeyword} />
      <AssignmentList keyword={debouncedKeyword} />
    </div>
  )
}
