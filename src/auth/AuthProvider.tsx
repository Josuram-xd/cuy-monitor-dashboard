import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { unauthorizedNotifier, type UnauthorizedNotifier } from '../api/UnauthorizedNotifier'
import type { AuthToken } from '../types/Auth'
import { AuthContext, type AuthContextValue, type LogoutReason } from './AuthContext'
import { tokenStorage, type Session, type TokenStorage } from './tokenStorage'

// backend message for a DISABLED account (auth-api.md, account errors)
const DISABLED_MESSAGE = 'account is disabled'

interface AuthProviderProps {
  children: ReactNode
  storage?: TokenStorage
  notifier?: UnauthorizedNotifier
  // e.g. queryClient.clear(), so no data of the previous session stays on screen
  onLogout?: () => void
}

export function AuthProvider({
  children,
  storage = tokenStorage,
  notifier = unauthorizedNotifier,
  onLogout,
}: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(() => storage.read())
  const [lastLogoutReason, setLastLogoutReason] = useState<LogoutReason | null>(null)

  const logout = useCallback(
    (reason: LogoutReason) => {
      storage.clear()
      setSession(null)
      setLastLogoutReason(reason)
      onLogout?.()
    },
    [storage, onLogout],
  )

  const signIn = useCallback(
    (token: AuthToken) => {
      setSession(storage.save(token))
      setLastLogoutReason(null)
    },
    [storage],
  )

  // a protected call got 401: expired token, or the account was deactivated meanwhile
  useEffect(
    () =>
      notifier.subscribe((error) =>
        logout(error.message === DISABLED_MESSAGE ? 'disabled' : 'expired'),
      ),
    [notifier, logout],
  )

  // the token lasts 30 min and there is no refresh: close the session when it expires
  useEffect(() => {
    if (!session) {
      return
    }
    const timeout = setTimeout(
      () => logout('expired'),
      Math.max(0, Date.parse(session.expiresAt) - Date.now()),
    )
    return () => clearTimeout(timeout)
  }, [session, logout])

  const value = useMemo<AuthContextValue>(
    () => ({ session, isAuthenticated: session !== null, lastLogoutReason, signIn, logout }),
    [session, lastLogoutReason, signIn, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
