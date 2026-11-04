import { useQueries, useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { queryKeys } from './queryKeys'

export function useGuineaPigs(cageId: string) {
  return useQuery({
    queryKey: queryKeys.guineaPigs(cageId),
    queryFn: async ({ signal }) => (await getDashboardApi()).guineaPigs.list(cageId, signal),
  })
}

// the cuyes of several cages at once (the alerts page, where alerts of every cage are mixed)
export function useGuineaPigsOfCages(cageIds: string[]) {
  return useQueries({
    queries: cageIds.map((cageId) => ({
      queryKey: queryKeys.guineaPigs(cageId),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        (await getDashboardApi()).guineaPigs.list(cageId, signal),
    })),
    combine: (results) => results.flatMap((result) => result.data ?? []),
  })
}
