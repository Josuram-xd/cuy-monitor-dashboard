import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/ApiError'
import { getDashboardApi } from '../api/apiProvider'
import type { DashboardApi } from '../api/DashboardApi'
import { UnauthorizedNotifier } from '../api/UnauthorizedNotifier'
import { createMockApi } from '../mocks/createMockApi'
import { mockSession } from '../mocks/mockSession'
import { AuthProvider } from './AuthProvider'
import { loginPathFor, safeNextPath } from './nextPath'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { RequireAuth } from './RequireAuth'

vi.mock('../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function WhereAmI() {
  const location = useLocation()
  return <p>at {location.pathname + location.search}</p>
}

function renderAt(path: string, api: DashboardApi = createMockApi(undefined, 0)) {
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  const router = createMemoryRouter(
    [
      { element: <PublicOnlyRoute />, children: [{ path: 'login', element: <WhereAmI /> }] },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <p>cage</p> },
          { path: 'alerts', element: <p>alerts</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider notifier={new UnauthorizedNotifier()}>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('RequireAuth', () => {
  beforeEach(() => {
    mockSession.end()
  })

  it('waits for the server instead of flashing the login form', () => {
    mockSession.start()

    renderAt('/alerts')

    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
    expect(screen.queryByText('at /login')).not.toBeInTheDocument()
    expect(screen.queryByText('alerts')).not.toBeInTheDocument()
  })

  it('sends to /login and remembers where the user wanted to go', async () => {
    renderAt('/alerts?status=OPEN')

    expect(await screen.findByText('at /login?next=%2Falerts%3Fstatus%3DOPEN')).toBeInTheDocument()
    expect(screen.queryByText('alerts')).not.toBeInTheDocument()
  })

  it('sends to plain /login from the home page', async () => {
    renderAt('/')

    expect(await screen.findByText('at /login')).toBeInTheDocument()
  })

  it('shows the private page when the server recognises the session', async () => {
    mockSession.start()

    renderAt('/alerts')

    expect(await screen.findByText('alerts')).toBeInTheDocument()
  })

  it('does not send to /login when the server cannot be reached', async () => {
    const api = createMockApi(undefined, 0)
    api.account.getProfile = () => Promise.reject(new ApiError(0, 'network_error'))

    renderAt('/alerts', api)

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor')
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument()
    expect(screen.queryByText('at /login')).not.toBeInTheDocument()
  })
})

describe('PublicOnlyRoute', () => {
  beforeEach(() => {
    mockSession.end()
  })

  it('sends a signed-in user from /login to the page in ?next', async () => {
    mockSession.start()

    renderAt('/login?next=%2Falerts')

    expect(await screen.findByText('alerts')).toBeInTheDocument()
  })

  it('shows /login without a session', async () => {
    renderAt('/login')

    expect(await screen.findByText('at /login')).toBeInTheDocument()
  })
})

describe('next path', () => {
  it.each([
    [null, '/'],
    ['/alerts', '/alerts'],
    ['//evil.com', '/'],
    ['https://evil.com', '/'],
    ['alerts', '/'],
  ])('safeNextPath(%s) is %s', (next, expected) => {
    expect(safeNextPath(next)).toBe(expected)
  })

  it('builds the login path with the current page', () => {
    expect(loginPathFor('/guinea-pigs/3')).toBe('/login?next=%2Fguinea-pigs%2F3')
  })
})
