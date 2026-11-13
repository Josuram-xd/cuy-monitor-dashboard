import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'

export function useStartSimulation(cageId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await getDashboardApi()).cages.startSimulation(cageId),
    // the distress clip raises a cage alert right away: show it without waiting for the socket
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cage', cageId] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      ]),
  })
}
