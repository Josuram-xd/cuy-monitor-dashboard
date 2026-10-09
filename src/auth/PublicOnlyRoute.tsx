import { Navigate, Outlet, useSearchParams } from 'react-router'
import { SessionLoading } from '../components/SessionLoading/SessionLoading'
import { safeNextPath } from './nextPath'
import { useAuth } from './useAuth'

// /login, /register and /verify: with a session there is nothing to do here.
export function PublicOnlyRoute() {
  const { status } = useAuth()
  const [searchParams] = useSearchParams()

  if (status === 'checking') {
    return <SessionLoading />
  }
  if (status === 'authenticated') {
    return <Navigate to={safeNextPath(searchParams.get('next'))} replace />
  }
  return <Outlet />
}
