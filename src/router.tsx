import { createBrowserRouter, type RouteObject } from 'react-router'
import { PublicOnlyRoute } from './auth/PublicOnlyRoute'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout/AppLayout'
import { CageOverview } from './pages/CageOverview/CageOverview'
import { ComingSoon } from './pages/ComingSoon/ComingSoon'
import { NotFound } from './pages/NotFound/NotFound'

export const routes: RouteObject[] = [
  {
    // login, registration and the verification code; with a session they redirect to "/"
    element: <PublicOnlyRoute />,
    children: [
      { path: 'login', element: <ComingSoon /> },
      { path: 'register', element: <ComingSoon /> },
      { path: 'verify', element: <ComingSoon /> },
    ],
  },
  {
    // everything else needs a session
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <CageOverview /> },
          { path: 'alerts', element: <ComingSoon /> },
          { path: 'guinea-pigs/new', element: <ComingSoon /> },
          { path: 'guinea-pigs/:id', element: <ComingSoon /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
