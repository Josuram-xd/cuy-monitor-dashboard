import { createContext } from 'react'
import type { AuthToken } from '../types/Auth'
import type { Session } from './tokenStorage'

// shown on /login by SessionNotice
export type LogoutReason = 'logout' | 'expired' | 'disabled'

export interface AuthContextValue {
  session: Session | null
  isAuthenticated: boolean
  lastLogoutReason: LogoutReason | null
  signIn: (token: AuthToken) => void
  logout: (reason: LogoutReason) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
