import { useQuery } from '@tanstack/react-query'
import { getCageHealth } from '../api/cages'
import { config } from '../config'
import { queryKeys } from './queryKeys'

export function useCageHealth(cageId: string = config.cageId) {
  return useQuery({
    queryKey: queryKeys.cageHealth(cageId),
    queryFn: ({ signal }) => getCageHealth(cageId, signal),
  })
}
