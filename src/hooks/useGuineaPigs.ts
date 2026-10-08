import { useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { config } from '../config'
import { queryKeys } from './queryKeys'

export function useGuineaPigs(cageId: string = config.cageId) {
  return useQuery({
    queryKey: queryKeys.guineaPigs(cageId),
    queryFn: async ({ signal }) => (await getDashboardApi()).guineaPigs.list(cageId, signal),
  })
}
