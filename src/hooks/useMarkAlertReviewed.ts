import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { Alert } from '../types/Alert'

export function useMarkAlertReviewed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => (await getDashboardApi()).alerts.markReviewed(id),
    // moves the alert from "open" to "reviewed" and may change what the banner of its cage says
    onSuccess: (alert: Alert) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['cage', alert.cageId] }),
      ]),
  })
}
