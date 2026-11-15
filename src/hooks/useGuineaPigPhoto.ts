import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { GuineaPigPhotoRequest } from '../types/GuineaPig'

// null removes the photo: one mutation because one control swaps between the two
export function useGuineaPigPhoto(cageId: string, id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: GuineaPigPhotoRequest | null) => {
      const api = (await getDashboardApi()).guineaPigs
      return body ? api.setPhoto(cageId, id, body) : api.removePhoto(cageId, id)
    },
    // the cage page, the grid and this page read the same list: refreshing the cage updates all of them
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cage', cageId] }),
  })
}
