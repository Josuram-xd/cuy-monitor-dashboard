import { useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { AlertStatus } from '../types/Alert'
import { queryKeys } from './queryKeys'

export function useAlerts(status?: AlertStatus) {
  return useQuery({
    queryKey: queryKeys.alerts(status),
    queryFn: async ({ signal }) => (await getDashboardApi()).alerts.list(status, signal),
  })
}
