import { Client, ReconnectionTimeMode, type StompSubscription } from '@stomp/stompjs'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getDashboardApi } from '../api/apiProvider'
import { config } from '../config'
import { useCages } from '../hooks/useCages'
import { LiveConnectionContext, type AlertListener, type LiveStatus } from './LiveConnectionContext'
import {
  applyLiveMessage,
  cageTopic,
  parseLiveMessage,
  refreshAfterReconnect,
} from './liveMessages'
import { wsUrl } from './wsUrl'

const FIRST_RETRY_MS = 1_000
const MAX_RETRY_MS = 30_000

interface LiveConnectionProviderProps {
  children: ReactNode
  // the mocks have no backend to connect to
  enabled?: boolean
}

// The one STOMP connection of the app. It lives inside RequireAuth, so there is no connection
// without a session, and it closes when the session ends. It follows the topic of every cage of the
// account (Task 6.2): each message updates the cache, and alerts are handed to AlertToast (Task 6.4).
export function LiveConnectionProvider({
  children,
  enabled = !config.useMocks,
}: LiveConnectionProviderProps) {
  const [status, setStatus] = useState<LiveStatus>('connecting')
  const [client, setClient] = useState<Client | null>(null)
  const queryClient = useQueryClient()
  const cages = useCages()
  const listeners = useRef(new Set<AlertListener>())

  useEffect(() => {
    if (!enabled) {
      return
    }
    const stomp = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: FIRST_RETRY_MS,
      maxReconnectDelay: MAX_RETRY_MS,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    })
    let connectedBefore = false
    // no headers: the browser sends the session cookie on the handshake by itself
    stomp.onConnect = () => {
      setStatus('connected')
      if (connectedBefore) {
        refreshAfterReconnect(queryClient)
      }
      connectedBefore = true
      setClient(stomp)
    }
    stomp.onWebSocketClose = () => {
      setStatus('reconnecting')
      setClient(null)
    }
    // The backend answers ERROR when the cookie on CONNECT is missing, invalid or expired. Any protected
    // call renews it (or ends the session if it cannot); the client then reconnects with the new cookie.
    stomp.onStompError = () => {
      void getDashboardApi()
        .then((api) => api.account.getProfile())
        .catch(() => {})
    }

    stomp.activate()
    return () => {
      setClient(null)
      void stomp.deactivate()
    }
  }, [enabled, queryClient])

  const cageIds = (cages.data ?? []).map((cage) => cage.cageId).join(',')

  // one subscription per cage, renewed on every connection and when cages are added or removed
  useEffect(() => {
    if (!client || !cageIds) {
      return
    }
    const subscriptions: StompSubscription[] = cageIds.split(',').map((cageId) =>
      client.subscribe(cageTopic(cageId), (frame) => {
        const message = parseLiveMessage(frame.body)
        if (!message) {
          return
        }
        const alert = applyLiveMessage(queryClient, message)
        if (alert) {
          listeners.current.forEach((listener) => listener(alert))
        }
      }),
    )
    return () => {
      // the connection may already be gone; then there is nothing to unsubscribe from
      if (client.connected) {
        subscriptions.forEach((subscription) => subscription.unsubscribe())
      }
    }
  }, [client, cageIds, queryClient])

  const onAlert = useCallback((listener: AlertListener) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  const value = useMemo(
    () => ({ status: enabled ? status : ('disconnected' as const), onAlert }),
    [enabled, status, onAlert],
  )

  return <LiveConnectionContext.Provider value={value}>{children}</LiveConnectionContext.Provider>
}
