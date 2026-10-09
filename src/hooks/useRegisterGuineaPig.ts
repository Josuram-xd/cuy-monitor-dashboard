import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { config } from '../config'
import type { NewGuineaPig } from '../types/GuineaPig'

export function useRegisterGuineaPig(cageId: string = config.cageId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: NewGuineaPig) =>
      (await getDashboardApi()).guineaPigs.register(cageId, body),
    // the new cuy shows up in the grid and in the cage summary; a 409 also needs a fresh list of colors
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['cage', cageId] }),
  })
}
