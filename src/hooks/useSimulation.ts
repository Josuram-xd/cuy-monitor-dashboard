import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { queryKeys } from './queryKeys'

// the simulation cage of the account; the cage list is asked again, so it shows up there
export function useSimulationCage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await getDashboardApi()).cages.createSimulationCage(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.cages }),
  })
}

// while the video runs, its progress is asked again every 5 seconds
export function useSimulationStatus(cageId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.simulationStatus(cageId),
    queryFn: async ({ signal }) =>
      (await getDashboardApi()).cages.getSimulationStatus(cageId, signal),
    enabled,
    refetchInterval: (query) => (query.state.data?.running ? 5_000 : false),
  })
}

export function useStopSimulation(cageId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => (await getDashboardApi()).cages.stopSimulation(cageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cage', cageId] }),
  })
}
