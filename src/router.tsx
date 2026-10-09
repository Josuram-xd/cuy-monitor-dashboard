import { createBrowserRouter, type RouteObject } from 'react-router'
import { PublicOnlyRoute } from './auth/PublicOnlyRoute'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout/AppLayout'
import { Account } from './pages/Account/Account'
import { CageOverview } from './pages/CageOverview/CageOverview'
import { ComingSoon } from './pages/ComingSoon/ComingSoon'
import { Login } from './pages/Login/Login'
import { NotFound } from './pages/NotFound/NotFound'
import { Register } from './pages/Register/Register'
import { VerifyCode } from './pages/VerifyCode/VerifyCode'

export const routes: RouteObject[] = [
  {
    // login, registration and the verification code; with a session they redirect to "/"
    element: <PublicOnlyRoute />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'verify', element: <VerifyCode /> },
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
          { path: 'account', element: <Account /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
