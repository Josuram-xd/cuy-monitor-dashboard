import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { config } from '../config'

export function useMarkAlertReviewed(cageId: string = config.cageId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => (await getDashboardApi()).alerts.markReviewed(id),
    // moves the alert from "open" to "reviewed" and may change what the cage banner says
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['cage', cageId] }),
      ]),
  })
}
