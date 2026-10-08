import { useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { config } from '../config'
import { queryKeys } from './queryKeys'

export function useCageHealth(cageId: string = config.cageId) {
  return useQuery({
    queryKey: queryKeys.cageHealth(cageId),
    queryFn: async ({ signal }) => (await getDashboardApi()).cages.getHealth(cageId, signal),
  })
}
