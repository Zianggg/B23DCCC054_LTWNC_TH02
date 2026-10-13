import { NOW } from '@/test/fixtures'
import { generateAssignments, readStressCount, STRESS_TEST_SIZE } from './stressData'

describe('generateAssignments', () => {
  it('sinh đúng số bài, id không trùng, hạn nộp đúng định dạng YYYY-MM-DD', () => {
    const items = generateAssignments(STRESS_TEST_SIZE, NOW)

    expect(items).toHaveLength(10_000)
    expect(new Set(items.map((item) => item.id)).size).toBe(10_000)
    expect(items.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate))).toBe(true)
  })

  it('cùng ngày thì cùng dữ liệu — id ổn định để bài đã ghim vẫn còn sau khi sinh lại', () => {
    expect(generateAssignments(20, NOW)).toEqual(generateAssignments(20, NOW))
    expect(generateAssignments(1, NOW)[0]).toMatchObject({ id: 'stress-1', dueDate: '2026-09-13', completed: true })
  })

  it('trường hợp biên: count = 0 trả về mảng rỗng', () => {
    expect(generateAssignments(0, NOW)).toEqual([])
  })
})

describe('readStressCount', () => {
  it('đọc ?stress và ?stress=N trên URL', () => {
    expect(readStressCount('')).toBe(0)
    expect(readStressCount('?stress')).toBe(STRESS_TEST_SIZE)
    expect(readStressCount('?stress=500')).toBe(500)
  })

  it('giá trị sai thì dùng mặc định, quá lớn thì chặn ở 100.000', () => {
    expect(readStressCount('?stress=abc')).toBe(STRESS_TEST_SIZE)
    expect(readStressCount('?stress=-3')).toBe(STRESS_TEST_SIZE)
    expect(readStressCount('?stress=999999')).toBe(100_000)
  })
})
