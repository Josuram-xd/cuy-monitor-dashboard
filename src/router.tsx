import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import { PublicOnlyRoute } from './auth/PublicOnlyRoute'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout/AppLayout'
import { Skeleton } from './components/Skeleton/Skeleton'
import { CageList } from './pages/CageList/CageList'
import { CageOverview } from './pages/CageOverview/CageOverview'
import { Login } from './pages/Login/Login'
import { NotFound } from './pages/NotFound/NotFound'
import { Register } from './pages/Register/Register'
import { VerifyCode } from './pages/VerifyCode/VerifyCode'

// Task 11.4: the pages a breeder opens less often (and the detail with its charts) come in their own
// chunk the first time they are visited; the cage list and the cage, the main path, stay in the bundle
function page<Name extends string>(
  load: () => Promise<Record<Name, ComponentType>>,
  name: Name,
): LazyExoticComponent<ComponentType> {
  return lazy(() => load().then((module) => ({ default: module[name] })))
}

const GuineaPigDetail = page(
  () => import('./pages/GuineaPigDetail/GuineaPigDetail'),
  'GuineaPigDetail',
)
const RegisterGuineaPig = page(
  () => import('./pages/RegisterGuineaPig/RegisterGuineaPig'),
  'RegisterGuineaPig',
)
const Alerts = page(() => import('./pages/Alerts/Alerts'), 'Alerts')
const HowItWorks = page(() => import('./pages/HowItWorks/HowItWorks'), 'HowItWorks')
const Account = page(() => import('./pages/Account/Account'), 'Account')
const Settings = page(() => import('./pages/Settings/Settings'), 'Settings')

function lazyPage(Page: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={<Skeleton count={3} />}>
      <Page />
    </Suspense>
  )
}

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
          { path: 'cages/:cageId/guinea-pigs/new', element: lazyPage(RegisterGuineaPig) },
          { path: 'cages/:cageId/guinea-pigs/:id', element: lazyPage(GuineaPigDetail) },
          { path: 'alerts', element: lazyPage(Alerts) },
          { path: 'how-it-works', element: lazyPage(HowItWorks) },
          { path: 'account', element: lazyPage(Account) },
          { path: 'settings', element: lazyPage(Settings) },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
