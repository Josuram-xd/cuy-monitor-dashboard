import { Client, ReconnectionTimeMode } from '@stomp/stompjs'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getDashboardApi } from '../api/apiProvider'
import { config } from '../config'
import { LiveConnectionContext, type LiveStatus } from './LiveConnectionContext'
import { wsUrl } from './wsUrl'

const FIRST_RETRY_MS = 1_000
const MAX_RETRY_MS = 30_000

interface LiveConnectionProviderProps {
  children: ReactNode
  // the mocks have no backend to connect to
  enabled?: boolean
}

// The one STOMP connection of the app. It lives inside RequireAuth, so there is
// no connection without a session, and it closes when the session ends.
export function LiveConnectionProvider({
  children,
  enabled = !config.useMocks,
}: LiveConnectionProviderProps) {
  const [status, setStatus] = useState<LiveStatus>('connecting')

  useEffect(() => {
    if (!enabled) {
      return
    }
    const client = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: FIRST_RETRY_MS,
      maxReconnectDelay: MAX_RETRY_MS,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    })
    // no headers: the browser sends the session cookie on the handshake by itself
    client.onConnect = () => setStatus('connected')
    client.onWebSocketClose = () => setStatus('reconnecting')
    // The backend answers ERROR when the cookie on CONNECT is missing, invalid or expired. Any protected
    // call renews it (or ends the session if it cannot); the client then reconnects with the new cookie.
    client.onStompError = () => {
      void getDashboardApi()
        .then((api) => api.account.getProfile())
        .catch(() => {})
    }

    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [enabled])

  const value = useMemo(
    () => ({ status: enabled ? status : ('disconnected' as const) }),
    [enabled, status],
  )

  return <LiveConnectionContext.Provider value={value}>{children}</LiveConnectionContext.Provider>
}
