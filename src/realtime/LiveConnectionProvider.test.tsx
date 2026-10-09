import { Client, ReconnectionTimeMode } from '@stomp/stompjs'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../api/apiProvider'
import { createMockApi } from '../mocks/createMockApi'
import { LiveConnectionProvider } from './LiveConnectionProvider'
import { useLiveConnection } from './useLiveConnection'

vi.mock('../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function StatusProbe() {
  const { status } = useLiveConnection()
  return <span>{status}</span>
}

function renderProvider(enabled: boolean) {
  return render(
    <LiveConnectionProvider enabled={enabled}>
      <StatusProbe />
    </LiveConnectionProvider>,
  )
}

describe('LiveConnectionProvider', () => {
  beforeEach(() => {
    vi.mocked(getDashboardApi).mockResolvedValue(createMockApi(undefined, 0))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('activates one client with bounded exponential reconnection and no token headers', () => {
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
    // the session cookie travels on the handshake by itself: nothing is added to the CONNECT frame
    expect(client.connectHeaders).toEqual({})
    view.unmount()
    expect(deactivate).toHaveBeenCalledOnce()
  })

  it('checks the session when the broker answers with an error, so the next attempt has a fresh cookie', async () => {
    const api = createMockApi(undefined, 0)
    const getProfile = vi.spyOn(api.account, 'getProfile').mockRejectedValue(new Error('offline'))
    vi.mocked(getDashboardApi).mockResolvedValue(api)
    const activate = vi.spyOn(Client.prototype, 'activate').mockImplementation(() => {})
    renderProvider(true)
    const context = activate.mock.contexts[0]
    if (!(context instanceof Client)) {
      throw new Error('The STOMP client did not activate')
    }

    await act(async () => {
      context.onStompError({ headers: {}, body: '' } as never)
      await Promise.resolve()
    })

    expect(getProfile).toHaveBeenCalledOnce()
  })

  it('does not open a connection when live updates are disabled', () => {
    const activate = vi.spyOn(Client.prototype, 'activate').mockImplementation(() => {})

    renderProvider(false)

    expect(screen.getByText('disconnected')).toBeInTheDocument()
    expect(activate).not.toHaveBeenCalled()
  })
})
