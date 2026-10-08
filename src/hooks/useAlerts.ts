import { useQuery } from '@tanstack/react-query'
import { listAlerts } from '../api/alerts'
import type { AlertStatus } from '../types/Alert'
import { queryKeys } from './queryKeys'

export function useAlerts(status?: AlertStatus) {
  return useQuery({
    queryKey: queryKeys.alerts(status),
    queryFn: ({ signal }) => listAlerts(status, signal),
  })
}
