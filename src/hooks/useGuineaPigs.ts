import { useQuery } from '@tanstack/react-query'
import { listGuineaPigs } from '../api/guineaPigs'
import { config } from '../config'
import { queryKeys } from './queryKeys'

export function useGuineaPigs(cageId: string = config.cageId) {
  return useQuery({
    queryKey: queryKeys.guineaPigs(cageId),
    queryFn: ({ signal }) => listGuineaPigs(cageId, signal),
  })
}
