import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { setupStore, type AppStore, type RootState } from '@/app/store'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  store?: AppStore
  /** Đường dẫn ban đầu cho component dùng react-router. */
  route?: string
  userEventOptions?: Parameters<typeof userEvent.setup>[0]
}

/** Render với store Redux riêng cho từng test (mẫu renderWithProviders trong tài liệu Redux). */
export function renderWithProviders(ui: ReactElement, options: ExtendedRenderOptions = {}) {
  const {
    preloadedState,
    store = setupStore(preloadedState),
    route = '/',
    userEventOptions,
    ...renderOptions
  } = options

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    )
  }

  return {
    store,
    user: userEvent.setup(userEventOptions),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}
