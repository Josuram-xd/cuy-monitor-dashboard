import { Navigate, Outlet, useSearchParams } from 'react-router'
import { safeNextPath } from './nextPath'
import { useAuth } from './useAuth'

// /login, /register and /verify: with a session there is nothing to do here.
export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()

  if (isAuthenticated) {
    return <Navigate to={safeNextPath(searchParams.get('next'))} replace />
  }
  return <Outlet />
}
