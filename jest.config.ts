import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/test/polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
  transform: {
    // ts-jest biên dịch TS/TSX sang CommonJS theo tsconfig.test.json (có kiểm tra kiểu).
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/src/test/styleMock.ts',
  },
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: ['src/features/**/*.{ts,tsx}', '!src/features/**/*.test.{ts,tsx}'],
  coverageReporters: ['text', 'text-summary', 'html'],
  // Yêu cầu đề bài: statements của thư mục features/ từ 70% trở lên, thấp hơn thì `npm test` báo lỗi.
  coverageThreshold: {
    // Kiểu Config của Jest bắt buộc có khoá global; mọi file đo đều nằm trong features/ nên để trống.
    global: {},
    './src/features/': {
      statements: 70,
    },
  },
}

export default config
