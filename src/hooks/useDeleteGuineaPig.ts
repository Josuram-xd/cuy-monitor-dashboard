import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { config } from '../config'

export function useDeleteGuineaPig(cageId: string = config.cageId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => (await getDashboardApi()).guineaPigs.remove(cageId, id),
    // the cuy leaves the grid and the cage summary; its alerts stay, so they are refreshed too
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cage', cageId] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      ]),
  })
}
