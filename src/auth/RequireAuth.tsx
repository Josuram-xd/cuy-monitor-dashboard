import { Navigate, Outlet, useLocation } from 'react-router'
import { ErrorState } from '../components/ErrorState/ErrorState'
import { SessionLoading } from '../components/SessionLoading/SessionLoading'
import { t } from '../i18n'
import { loginPathFor } from './nextPath'
import { useAuth } from './useAuth'

// Private pages: without a session go to /login and come back here afterwards.
export function RequireAuth() {
  const { status, retry } = useAuth()
  const location = useLocation()

  if (status === 'checking') {
    return <SessionLoading />
  }
  if (status === 'unavailable') {
    // we could not ask the server: that is not the same as being logged out
    return <ErrorState message={t('errors.network')} onRetry={retry} />
  }
  if (status === 'anonymous') {
    return <Navigate to={loginPathFor(location.pathname + location.search)} replace />
  }
  return <Outlet />
}
