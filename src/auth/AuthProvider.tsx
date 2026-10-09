import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '../api/ApiError'
import { getDashboardApi } from '../api/apiProvider'
import { unauthorizedNotifier, type UnauthorizedNotifier } from '../api/UnauthorizedNotifier'
import { queryKeys } from '../hooks/queryKeys'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type LogoutReason,
} from './AuthContext'

// backend message for a DISABLED account (auth-api.md, account errors)
const DISABLED_MESSAGE = 'account is disabled'

interface AuthProviderProps {
  children: ReactNode
  notifier?: UnauthorizedNotifier
  // e.g. queryClient.clear(), so no data of the previous session stays on screen
  onLogout?: () => void
}

// The page never holds a token: the session lives in HttpOnly cookies. So on every load we ask
// the server who we are (GET /account/profile). Answer: a profile = logged in, 401 = logged out.
// That is also what makes a reload, a second tab or "back" keep the session.
export function AuthProvider({
  children,
  notifier = unauthorizedNotifier,
  onLogout,
}: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [lastLogoutReason, setLastLogoutReason] = useState<LogoutReason | null>(null)
  const statusRef = useRef(status)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  // the state only changes when the server answers
  const askServer = useCallback(() => {
    queryClient
      .fetchQuery({
        queryKey: queryKeys.profile,
        queryFn: async ({ signal }) => (await getDashboardApi()).account.getProfile(signal),
        staleTime: 0,
      })
      .then(() => setStatus('authenticated'))
      .catch((error: unknown) =>
        setStatus(error instanceof ApiError && error.isUnauthorized ? 'anonymous' : 'unavailable'),
      )
  }, [queryClient])

  useEffect(() => {
    askServer()
  }, [askServer])

  const retry = useCallback(() => {
    setStatus('checking')
    askServer()
  }, [askServer])

  const logout = useCallback(
    (reason: LogoutReason) => {
      // best effort: the server revokes the tokens and expires the cookies
      void getDashboardApi()
        .then((api) => api.auth.logout())
        .catch(() => {})
      setStatus('anonymous')
      setLastLogoutReason(reason)
      onLogout?.()
    },
    [onLogout],
  )

  const signIn = useCallback(() => {
    setLastLogoutReason(null)
    setStatus('authenticated')
    void queryClient.invalidateQueries({ queryKey: queryKeys.profile })
  }, [queryClient])

  // a protected call got 401 and the refresh failed: expired, revoked or deactivated account
  useEffect(
    () =>
      notifier.subscribe((error) => {
        // while checking, a 401 only means "nobody is logged in": not a lost session
        if (statusRef.current === 'authenticated') {
          logout(error.message === DISABLED_MESSAGE ? 'disabled' : 'expired')
        }
      }),
    [notifier, logout],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === 'authenticated',
      lastLogoutReason,
      signIn,
      logout,
      retry,
    }),
    [status, lastLogoutReason, signIn, logout, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
