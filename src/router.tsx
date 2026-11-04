import { createBrowserRouter, type RouteObject } from 'react-router'
import { PublicOnlyRoute } from './auth/PublicOnlyRoute'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout/AppLayout'
import { Account } from './pages/Account/Account'
import { Alerts } from './pages/Alerts/Alerts'
import { CageList } from './pages/CageList/CageList'
import { CageOverview } from './pages/CageOverview/CageOverview'
import { GuineaPigDetail } from './pages/GuineaPigDetail/GuineaPigDetail'
import { HowItWorks } from './pages/HowItWorks/HowItWorks'
import { Login } from './pages/Login/Login'
import { NotFound } from './pages/NotFound/NotFound'
import { RegisterGuineaPig } from './pages/RegisterGuineaPig/RegisterGuineaPig'
import { Settings } from './pages/Settings/Settings'
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
          // "Mis jaulas"; each cage and what is inside it lives under /cages/:cageId
          { index: true, element: <CageList /> },
          { path: 'cages/:cageId', element: <CageOverview /> },
          { path: 'cages/:cageId/guinea-pigs/new', element: <RegisterGuineaPig /> },
          { path: 'cages/:cageId/guinea-pigs/:id', element: <GuineaPigDetail /> },
          { path: 'alerts', element: <Alerts /> },
          { path: 'how-it-works', element: <HowItWorks /> },
          { path: 'account', element: <Account /> },
          { path: 'settings', element: <Settings /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
