import { Client, ReconnectionTimeMode } from '@stomp/stompjs'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { tokenStorage } from '../auth/tokenStorage'
import { LiveConnectionProvider } from './LiveConnectionProvider'
import { useLiveConnection } from './useLiveConnection'

function StatusProbe() {
  const { status } = useLiveConnection()
  return <span>{status}</span>
}

function renderProvider(enabled: boolean) {
  return render(
    <AuthProvider>
      <LiveConnectionProvider enabled={enabled}>
        <StatusProbe />
      </LiveConnectionProvider>
    </AuthProvider>,
  )
}

describe('LiveConnectionProvider', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('activates one client with bounded exponential reconnection and a fresh token', async () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    const readSession = vi.spyOn(tokenStorage, 'read').mockReturnValue({
      accessToken: 'first-test-token',
      expiresAt,
    })
    const activate = vi.spyOn(Client.prototype, 'activate').mockImplementation(() => {})
    const deactivate = vi.spyOn(Client.prototype, 'deactivate').mockResolvedValue(undefined)

    const view = renderProvider(true)

    expect(screen.getByText('connecting')).toBeInTheDocument()
    const context = activate.mock.contexts[0]
    if (!(context instanceof Client)) {
      throw new Error('The STOMP client did not activate')
    }
    const client = context

    expect(client.reconnectDelay).toBe(1_000)
    expect(client.maxReconnectDelay).toBe(30_000)
    expect(client.reconnectTimeMode).toBe(ReconnectionTimeMode.EXPONENTIAL)

    await act(async () => {
      await client.beforeConnect(client)
    })

    expect(client.connectHeaders).toEqual({ Authorization: 'Bearer first-test-token' })

    readSession.mockReturnValue({ accessToken: 'refreshed-test-token', expiresAt })
    await act(async () => {
      await client.beforeConnect(client)
    })

    expect(client.connectHeaders).toEqual({ Authorization: 'Bearer refreshed-test-token' })
    view.unmount()
    expect(deactivate).toHaveBeenCalledOnce()
  })

  it('does not open a connection when live updates are disabled', () => {
    const activate = vi.spyOn(Client.prototype, 'activate').mockImplementation(() => {})

    renderProvider(false)

    expect(screen.getByText('disconnected')).toBeInTheDocument()
    expect(activate).not.toHaveBeenCalled()
  })
})
