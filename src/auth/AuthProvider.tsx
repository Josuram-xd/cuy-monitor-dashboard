import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthToken } from '../types/Auth'
import { AuthContext, type AuthContextValue, type LogoutReason } from './AuthContext'
import { tokenStorage, type Session, type TokenStorage } from './tokenStorage'

interface AuthProviderProps {
  children: ReactNode
  storage?: TokenStorage
  // e.g. queryClient.clear(), so no data of the previous session stays on screen
  onLogout?: () => void
}

export function AuthProvider({ children, storage = tokenStorage, onLogout }: AuthProviderProps) {
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
