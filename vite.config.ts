import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * `--mode before`: '@/App' trỏ sang src/before/App.tsx — bản chưa áp dụng các kỹ thuật tối ưu,
 * dùng để đo Profiler/Lighthouse "trước". Mặc định (mode development/production) là bản đã tối ưu.
 */
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Cache riêng cho từng bản để chạy song song `dev` và `dev:before` mà không ghi đè dependency đã tối ưu của nhau.
  cacheDir: mode === 'before' ? 'node_modules/.vite-before' : 'node_modules/.vite',
  resolve: {
    alias: [
      ...(mode === 'before' ? [{ find: /^@\/App$/, replacement: path.resolve(__dirname, './src/before/App.tsx') }] : []),
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
  build: {
    rollupOptions: {
      treeshake: {
        // redux-logger chỉ có bản UMD nên Rollup giữ nguyên cả gói dù production không gọi createLogger.
        // Khai báo gói này không có side effect để bản build bỏ hẳn nó (store chỉ bật logger khi development).
        moduleSideEffects: (id) => !/[\\/]node_modules[\\/]redux-logger[\\/]/.test(id),
      },
    },
  },
}))
