import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'

export function useDeleteGuineaPig(cageId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => (await getDashboardApi()).guineaPigs.remove(cageId, id),
    // the guinea pig leaves the grid and the cage summary; its alerts stay, so they are refreshed too
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cage', cageId] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      ]),
  })
}
