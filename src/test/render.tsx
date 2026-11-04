import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'

// fresh cache per test and no retries, so errors show up right away
export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

// a page that lives under /cages/:cageId, rendered on that route (by default the mocks' pilot cage)
export function renderInCage(
  ui: ReactElement,
  { path = '', cageId = 'cage-1', route }: { path?: string; cageId?: string; route?: string } = {},
) {
  return renderWithProviders(
    <Routes>
      <Route path={`/cages/:cageId${path}`} element={ui} />
      <Route path="*" element={<p>{'other page'}</p>} />
    </Routes>,
    { route: route ?? `/cages/${cageId}${path.replace(/:\w+/g, '1')}` },
  )
}
