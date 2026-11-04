import { useQueries, useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { LIVE_REFRESH_MS, queryKeys } from './queryKeys'

export function useGuineaPigs(cageId: string) {
  return useQuery({
    queryKey: queryKeys.guineaPigs(cageId),
    queryFn: async ({ signal }) => (await getDashboardApi()).guineaPigs.list(cageId, signal),
    refetchInterval: LIVE_REFRESH_MS,
  })
}

// the guinea pigs of several cages at once (the alerts page, where alerts of every cage are mixed)
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
