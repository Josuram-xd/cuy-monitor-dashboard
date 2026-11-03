import { useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { AlertStatus } from '../types/Alert'
import { LIVE_REFRESH_MS, queryKeys } from './queryKeys'

// without cageId: the alerts of every cage of the account
export function useAlerts(status?: AlertStatus, cageId?: string) {
  return useQuery({
    queryKey: queryKeys.alerts(status, cageId),
    queryFn: async ({ signal }) => (await getDashboardApi()).alerts.list(status, cageId, signal),
    refetchInterval: LIVE_REFRESH_MS,
  })
}
