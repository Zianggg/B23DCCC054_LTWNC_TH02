import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router'
// Chế độ `--mode before` (vite.config.ts) trỏ '@/App' sang src/before/App.tsx — bản chưa tối ưu để đo so sánh.
import App from '@/App'
import { store } from '@/app/store'
import { ThemeProvider } from '@/features/theme/ThemeContext'
import './index.css'

// ThemeProvider bọc ngoài cùng và nhận phần còn lại qua children: đổi theme chỉ render lại
// ThemeProvider và các component gọi useTheme(), cây <Provider>…<App/> giữ nguyên element nên React bỏ qua.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  </StrictMode>,
)
