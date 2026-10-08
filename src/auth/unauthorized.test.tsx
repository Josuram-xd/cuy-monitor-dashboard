import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/ApiError'
import { HttpClient, type FetchFn } from '../api/HttpClient'
import { UnauthorizedNotifier } from '../api/UnauthorizedNotifier'
import { AuthProvider } from './AuthProvider'
import { TokenStorage } from './tokenStorage'
import { useAuth } from './useAuth'

const unauthorized = () =>
  new Response(
    JSON.stringify({ error: 'unauthorized', message: 'missing, invalid or expired token' }),
    {
      status: 401,
    },
  )

describe('HttpClient and 401', () => {
  it('sends the token as Bearer', async () => {
    const fetchFn = vi.fn<FetchFn>(() => Promise.resolve(new Response('{}', { status: 200 })))
    const client = new HttpClient('', { fetchFn, getToken: () => 'abc' })

    await client.get('/api/v1/users/me')

    expect(fetchFn).toHaveBeenCalledWith(
      '/api/v1/users/me',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc' }),
      }),
    )
  })

  it('reports a lost session when a call with a token gets 401', async () => {
    const onUnauthorized = vi.fn()
    const client = new HttpClient('', {
      fetchFn: () => Promise.resolve(unauthorized()),
      getToken: () => 'expired-token',
      onUnauthorized,
    })

    await expect(client.get('/api/v1/alerts')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('does not report it without a token: on login a 401 is just a wrong password', async () => {
    const onUnauthorized = vi.fn()
    const client = new HttpClient('', {
      fetchFn: () => Promise.resolve(unauthorized()),
      getToken: () => null,
      onUnauthorized,
    })

    await expect(client.post('/api/v1/auth/login', {})).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})

function SessionState() {
  const { isAuthenticated, lastLogoutReason } = useAuth()
  return (
    <p>
      {isAuthenticated ? 'in' : 'out'} {lastLogoutReason ?? 'none'}
    </p>
  )
}

function renderSignedIn(expiresInMs = 60_000) {
  const storage = new TokenStorage(null)
  storage.save({
    accessToken: 'token',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  })
  const notifier = new UnauthorizedNotifier()
  const onLogout = vi.fn()
  render(
    <AuthProvider storage={storage} notifier={notifier} onLogout={onLogout}>
      <SessionState />
    </AuthProvider>,
  )
  return { storage, notifier, onLogout }
}

describe('AuthProvider', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('logs out as expired when a protected call gets 401', () => {
    const { storage, notifier, onLogout } = renderSignedIn()
    expect(screen.getByText('in none')).toBeInTheDocument()

    act(() =>
      notifier.notify(new ApiError(401, 'unauthorized', 'missing, invalid or expired token')),
    )

    expect(screen.getByText('out expired')).toBeInTheDocument()
    expect(storage.read()).toBeNull()
    expect(onLogout).toHaveBeenCalled()
  })

  it('tells a deactivated account apart', () => {
    const { notifier } = renderSignedIn()

    act(() => notifier.notify(new ApiError(401, 'unauthorized', 'account is disabled')))

    expect(screen.getByText('out disabled')).toBeInTheDocument()
  })

  it('logs out by itself when the token expires', () => {
    vi.useFakeTimers()
    renderSignedIn(30 * 60_000)

    act(() => vi.advanceTimersByTime(30 * 60_000))

    expect(screen.getByText('out expired')).toBeInTheDocument()
  })
})
