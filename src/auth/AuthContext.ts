import { createContext } from 'react'

// shown on /login by SessionNotice
export type LogoutReason = 'logout' | 'expired' | 'disabled'

// checking: asking the server who we are (first load, reload, new tab)
// unavailable: the server could not be reached, so we don't know; not the same as "logged out"
export type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'unavailable'

export interface AuthContextValue {
  status: AuthStatus
  isAuthenticated: boolean
  lastLogoutReason: LogoutReason | null
  // the code was accepted and the server set the session cookies
  signIn: () => void
  logout: (reason: LogoutReason) => void
  // ask the server again after "unavailable"
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
