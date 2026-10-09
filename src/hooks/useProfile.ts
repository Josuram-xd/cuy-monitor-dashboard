import { useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { queryKeys } from './queryKeys'

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async ({ signal }) => (await getDashboardApi()).account.getProfile(signal),
  })
}
