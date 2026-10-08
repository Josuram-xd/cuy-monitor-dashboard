import { Client, ReconnectionTimeMode } from '@stomp/stompjs'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { tokenStorage } from '../auth/tokenStorage'
import { useAuth } from '../auth/useAuth'
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
  const { logout } = useAuth()
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
    // read the token on every attempt, so a reconnect never sends an old one
    client.beforeConnect = () => {
      const session = tokenStorage.read()
      client.connectHeaders = session ? { Authorization: `Bearer ${session.accessToken}` } : {}
    }
    client.onConnect = () => setStatus('connected')
    client.onWebSocketClose = () => setStatus('reconnecting')
    // the backend answers ERROR when the token on CONNECT is missing, invalid or expired
    client.onStompError = () => logout('expired')

    client.activate()
    return () => {
      void client.deactivate()
    }
  }, [enabled, logout])

  const value = useMemo(
    () => ({ status: enabled ? status : ('disconnected' as const) }),
    [enabled, status],
  )

  return <LiveConnectionContext.Provider value={value}>{children}</LiveConnectionContext.Provider>
}
