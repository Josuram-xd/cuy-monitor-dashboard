import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/ApiError'
import { getDashboardApi } from '../api/apiProvider'
import type { DashboardApi } from '../api/DashboardApi'
import { UnauthorizedNotifier } from '../api/UnauthorizedNotifier'
import { createMockApi } from '../mocks/createMockApi'
import { mockSession } from '../mocks/mockSession'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

vi.mock('../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function SessionState() {
  const { status, lastLogoutReason, signIn, retry } = useAuth()
  return (
    <div>
      <p>
        {status} {lastLogoutReason ?? 'none'}
      </p>
      <button onClick={signIn}>sign in</button>
      <button onClick={retry}>retry</button>
    </div>
  )
}

function setup(api: DashboardApi = createMockApi(undefined, 0)) {
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  const notifier = new UnauthorizedNotifier()
  const onLogout = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider notifier={notifier} onLogout={onLogout}>
        <SessionState />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { api, notifier, onLogout }
}

describe('AuthProvider', () => {
  beforeEach(() => {
    mockSession.end()
  })

  it('asks the server who we are before deciding anything', async () => {
    mockSession.start()

    setup()

    expect(screen.getByText('checking none')).toBeInTheDocument()
    expect(await screen.findByText('authenticated none')).toBeInTheDocument()
  })

  it('is logged out, without any notice, when nobody has a session', async () => {
    setup()

    expect(await screen.findByText('anonymous none')).toBeInTheDocument()
  })

  it('does not call a network failure "logged out" and can try again', async () => {
    mockSession.start()
    const api = createMockApi(undefined, 0)
    const getProfile = vi
      .spyOn(api.account, 'getProfile')
      .mockRejectedValueOnce(new ApiError(0, 'network_error'))
    setup(api)

    expect(await screen.findByText('unavailable none')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'retry' }))

    expect(await screen.findByText('authenticated none')).toBeInTheDocument()
    expect(getProfile).toHaveBeenCalledTimes(2)
  })

  it('logs out as expired when a protected call loses the session', async () => {
    mockSession.start()
    const { api, notifier, onLogout } = setup()
    const logout = vi.spyOn(api.auth, 'logout')
    await screen.findByText('authenticated none')

    act(() =>
      notifier.notify(new ApiError(401, 'unauthorized', 'missing, invalid or expired token')),
    )

    expect(await screen.findByText('anonymous expired')).toBeInTheDocument()
    expect(onLogout).toHaveBeenCalled()
    // the server is told, so the cookies are expired and the tokens revoked
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('tells a deactivated account apart', async () => {
    mockSession.start()
    const { notifier } = setup()
    await screen.findByText('authenticated none')

    act(() => notifier.notify(new ApiError(401, 'unauthorized', 'account is disabled')))

    expect(await screen.findByText('anonymous disabled')).toBeInTheDocument()
  })

  it('ignores a 401 while it is still checking: nobody was logged in', async () => {
    const api = createMockApi(undefined, 0)
    const { notifier, onLogout } = setup(api)

    act(() => notifier.notify(new ApiError(401, 'unauthorized')))
    await screen.findByText('anonymous none')

    expect(onLogout).not.toHaveBeenCalled()
  })

  it('signIn marks the session as started and clears an old notice', async () => {
    mockSession.start()
    const { notifier } = setup()
    await screen.findByText('authenticated none')
    act(() => notifier.notify(new ApiError(401, 'unauthorized')))
    await screen.findByText('anonymous expired')

    await userEvent.click(screen.getByRole('button', { name: 'sign in' }))

    expect(await screen.findByText('authenticated none')).toBeInTheDocument()
  })
})
