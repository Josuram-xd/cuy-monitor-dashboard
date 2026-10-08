import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppLayout } from './components/AppLayout/AppLayout'
import { ComingSoon } from './pages/ComingSoon/ComingSoon'
import { NotFound } from './pages/NotFound/NotFound'

// Private pages. They go behind RequireAuth in Task 13.4.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <ComingSoon /> },
      { path: 'alerts', element: <ComingSoon /> },
      { path: 'guinea-pigs/new', element: <ComingSoon /> },
      { path: 'guinea-pigs/:id', element: <ComingSoon /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
