import { TextDecoder, TextEncoder } from 'node:util'

// react-router v7 dùng TextEncoder ngay khi import; jsdom không có nên lấy bản của Node.
Object.assign(globalThis, { TextEncoder, TextDecoder })
