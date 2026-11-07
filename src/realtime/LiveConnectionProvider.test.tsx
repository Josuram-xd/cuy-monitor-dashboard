import { Client, ReconnectionTimeMode } from '@stomp/stompjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../api/apiProvider'
import { createMockApi } from '../mocks/createMockApi'
import { LiveConnectionProvider } from './LiveConnectionProvider'
import type { Alert } from '../types/Alert'
import { useLiveConnection } from './useLiveConnection'

vi.mock('../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function StatusProbe() {
  const { status } = useLiveConnection()
  return <span>{status}</span>
}

function renderProvider(enabled: boolean, child = <StatusProbe />) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <LiveConnectionProvider enabled={enabled}>{child}</LiveConnectionProvider>
    </QueryClientProvider>,
  )
}

function activatedClient(activate: { mock: { contexts: unknown[] } }): Client {
  const context = activate.mock.contexts[0]
  if (!(context instanceof Client)) {
    throw new Error('The STOMP client did not activate')
  }
  return context
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

  it('follows the topic of every cage of the account and hands its alerts to the listeners', async () => {
    const activate = vi.spyOn(Client.prototype, 'activate').mockImplementation(() => {})
    vi.spyOn(Client.prototype, 'deactivate').mockResolvedValue(undefined)
    vi.spyOn(Client.prototype, 'connected', 'get').mockReturnValue(true)
    const handlers = new Map<string, (frame: { body: string }) => void>()
    const unsubscribe = vi.fn()
    vi.spyOn(Client.prototype, 'subscribe').mockImplementation((topic, callback) => {
      handlers.set(topic, callback as never)
      return { id: topic, unsubscribe }
    })
    const heard: Alert[] = []
    function Listener() {
      const { onAlert } = useLiveConnection()
      useEffect(() => onAlert((alert) => heard.push(alert)), [onAlert])
      return null
    }

    const view = renderProvider(true, <Listener />)
    const client = activatedClient(activate)
    await act(async () => {
      client.onConnect({ headers: {}, body: '' } as never)
    })

    const cages = await (await getDashboardApi()).cages.list()
    await waitFor(() => expect(handlers.size).toBe(cages.length))
    expect([...handlers.keys()]).toEqual(cages.map((cage) => `/topic/cages/${cage.cageId}`))

    const alert = { id: 99, cageId: cages[0].cageId, level: 'CRITICAL', message: 'x' } as Alert
    act(() => {
      handlers.get(`/topic/cages/${cages[0].cageId}`)!({
        body: JSON.stringify({
          type: 'ALERT',
          cageId: cages[0].cageId,
          occurredAt: 'now',
          data: alert,
        }),
      })
    })
    expect(heard).toEqual([alert])

    view.unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(cages.length)
  })
})
