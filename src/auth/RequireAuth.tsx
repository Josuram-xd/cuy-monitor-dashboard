import { Navigate, Outlet, useLocation } from 'react-router'
import { loginPathFor } from './nextPath'
import { useAuth } from './useAuth'

// Private pages: without a session go to /login and come back here afterwards.
export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={loginPathFor(location.pathname + location.search)} replace />
  }
  return <Outlet />
}
