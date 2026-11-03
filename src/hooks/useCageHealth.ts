import { useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { LIVE_REFRESH_MS, queryKeys } from './queryKeys'

export function useCageHealth(cageId: string) {
  return useQuery({
    queryKey: queryKeys.cageHealth(cageId),
    queryFn: async ({ signal }) => (await getDashboardApi()).cages.getHealth(cageId, signal),
    refetchInterval: LIVE_REFRESH_MS,
  })
}
