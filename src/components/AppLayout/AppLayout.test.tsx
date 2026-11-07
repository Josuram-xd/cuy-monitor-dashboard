import { Client } from '@stomp/stompjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, Link, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import { UnauthorizedNotifier } from '../../api/UnauthorizedNotifier'
import { AuthProvider } from '../../auth/AuthProvider'
import { createMockApi } from '../../mocks/createMockApi'
import { AppLayout } from './AppLayout'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <h1>Mis jaulas</h1> },
          {
            path: '/alerts',
            element: (
              <>
                <h1>Alertas</h1>
                <Link to="/">Volver</Link>
              </>
            ),
          },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider notifier={new UnauthorizedNotifier()} onLogout={vi.fn()}>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return router
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.mocked(getDashboardApi).mockResolvedValue(createMockApi(undefined, 0))
    // no broker in a test
    vi.spyOn(Client.prototype, 'activate').mockImplementation(() => {})
  })

  it('puts the focus on the page title when the layout appears, as after logging in', async () => {
    renderAt('/')

    const title = await screen.findByRole('heading', { level: 1, name: 'Mis jaulas' })
    await waitFor(() => expect(title).toHaveFocus())
  })

  it('moves the focus to the title of every new page', async () => {
    const router = renderAt('/alerts')
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Alertas' })).toHaveFocus())

    await act(() => router.navigate('/'))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Mis jaulas' })).toHaveFocus())
  })
})
