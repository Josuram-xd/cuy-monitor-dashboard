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

// "Simular todas las jaulas": the same demo in every cage at once, to see the AI handle many of them.
// A cage without guinea pigs answers 400 and is skipped; it fails only when none could start.
export function useStartSimulations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cageIds: string[]) => {
      const api = await getDashboardApi()
      const results = await Promise.allSettled(cageIds.map((id) => api.cages.startSimulation(id)))
      const started = results.filter((r) => r.status === 'fulfilled').length
      if (started === 0) {
        throw new Error('no cage could start the simulation')
      }
      return started
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cage'] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      ]),
  })
}
