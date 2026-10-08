import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { UnauthorizedNotifier } from '../api/UnauthorizedNotifier'
import { AuthProvider } from './AuthProvider'
import { loginPathFor, safeNextPath } from './nextPath'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { RequireAuth } from './RequireAuth'
import { TokenStorage } from './tokenStorage'

function WhereAmI() {
  const location = useLocation()
  return <p>at {location.pathname + location.search}</p>
}

function renderAt(path: string, { signedIn }: { signedIn: boolean }) {
  const storage = new TokenStorage(null)
  if (signedIn) {
    storage.save({
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    })
  }
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
    <AuthProvider storage={storage} notifier={new UnauthorizedNotifier()}>
      <RouterProvider router={router} />
    </AuthProvider>,
  )
}

describe('RequireAuth', () => {
  it('sends to /login and remembers where the user wanted to go', () => {
    renderAt('/alerts?status=OPEN', { signedIn: false })

    expect(screen.getByText('at /login?next=%2Falerts%3Fstatus%3DOPEN')).toBeInTheDocument()
    expect(screen.queryByText('alerts')).not.toBeInTheDocument()
  })

  it('sends to plain /login from the home page', () => {
    renderAt('/', { signedIn: false })

    expect(screen.getByText('at /login')).toBeInTheDocument()
  })

  it('shows the private page with a session', () => {
    renderAt('/alerts', { signedIn: true })

    expect(screen.getByText('alerts')).toBeInTheDocument()
  })
})

describe('PublicOnlyRoute', () => {
  it('sends a signed-in user from /login to the page in ?next', () => {
    renderAt('/login?next=%2Falerts', { signedIn: true })

    expect(screen.getByText('alerts')).toBeInTheDocument()
  })

  it('shows /login without a session', () => {
    renderAt('/login', { signedIn: false })

    expect(screen.getByText('at /login')).toBeInTheDocument()
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
