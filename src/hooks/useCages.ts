import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { CageInput } from '../types/Cage'
import { queryKeys } from './queryKeys'

export function useCages() {
  return useQuery({
    queryKey: queryKeys.cages,
    queryFn: async ({ signal }) => (await getDashboardApi()).cages.list(signal),
  })
}

export function useCage(cageId: string) {
  return useQuery({
    queryKey: queryKeys.cage(cageId),
    queryFn: async ({ signal }) => (await getDashboardApi()).cages.get(cageId, signal),
  })
}

export function useCreateCage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CageInput) => (await getDashboardApi()).cages.create(body),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.cages }),
  })
}

export function useUpdateCage(cageId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CageInput) => (await getDashboardApi()).cages.update(cageId, body),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cages }),
        queryClient.invalidateQueries({ queryKey: ['cage', cageId] }),
      ]),
  })
}

export function useDeleteCage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cageId: string) => (await getDashboardApi()).cages.remove(cageId),
    // its alerts stop showing too
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cages }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      ]),
  })
}
