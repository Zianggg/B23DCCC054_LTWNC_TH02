import { useState } from 'react'
import { AssignmentsToolbar } from '@/features/assignments/AssignmentsToolbar'
import { AssignmentList } from './AssignmentList'

/** BẢN TRƯỚC TỐI ƯU: không debounce — mỗi phím gõ đi thẳng xuống danh sách 10.000 bài. */
export function AssignmentsPage() {
  const [keyword, setKeyword] = useState('')

  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      <AssignmentsToolbar keyword={keyword} onKeywordChange={setKeyword} />
      <AssignmentList keyword={keyword} />
    </div>
  )
}
