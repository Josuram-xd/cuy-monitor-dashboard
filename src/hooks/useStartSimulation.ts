import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'
import type { CageHealth } from '../types/CageHealth'
import { SIMULATION_CODE_PREFIX } from '../types/Cage'
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

export const DEMO_LIMIT = 10

export function selectDemoCages(states: CageHealth[]): string[] {
  // the simulation cage plays its own video: it is not one of the drawn demo cages
  const eligible = states.filter(
    (cage) =>
      !cage.monitoring &&
      cage.guineaPigs.length > 0 &&
      !cage.cageId.startsWith(SIMULATION_CODE_PREFIX),
  )
  const groups = (['CRITICAL', 'ALERT', 'OBSERVED', 'NORMAL'] as const).map((status) =>
    eligible.filter((cage) => cage.status === status),
  )
  const ids: string[] = []
  for (
    let index = 0;
    ids.length < DEMO_LIMIT && groups.some((group) => index < group.length);
    index++
  ) {
    for (const group of groups) {
      if (group[index] && ids.length < DEMO_LIMIT) ids.push(group[index].cageId)
    }
  }
  return ids
}
// A cage without guinea pigs answers 400 and is skipped; it fails only when none could start.
export function useStartSimulations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cageIds: string[]) => {
      const api = await getDashboardApi()
      // Reuse the health queries already displayed on the cage cards.
      const results = await Promise.allSettled(
        cageIds.map((id) =>
          queryClient.ensureQueryData({
            queryKey: queryKeys.cageHealth(id),
            queryFn: ({ signal }) => api.cages.getHealth(id, signal),
          }),
        ),
      )
      const selected = selectDemoCages(
        results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
      )
      let started = 0
      for (let i = 0; i < selected.length; i += 2) {
        const batch = await Promise.allSettled(
          selected.slice(i, i + 2).map((id) => api.cages.startSimulation(id)),
        )
        started += batch.filter((result) => result.status === 'fulfilled').length
      }
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
