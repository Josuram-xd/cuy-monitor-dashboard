import { lazy } from 'react'

// Recharts is most of the weight of the app: it is only downloaded when a page with a chart opens,
// not to sign in or to see the list of cages.
export const LazyBehaviorChart = lazy(() =>
  import('../components/BehaviorChart/BehaviorChart').then((m) => ({ default: m.BehaviorChart })),
)

export const LazyWeightChart = lazy(() =>
  import('../components/WeightChart/WeightChart').then((m) => ({ default: m.WeightChart })),
)
