import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { StationCameraInput } from '../types/StationCamera'
import { queryKeys } from './queryKeys'

// while the edge agent is testing a new camera (PENDING) it is asked again every 3 seconds
export function useStationCamera(cageId: string) {
  return useQuery({
    queryKey: queryKeys.stationCamera(cageId),
    queryFn: async ({ signal }) => (await getDashboardApi()).cages.getCamera(cageId, signal),
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 3_000 : 15_000),
  })
}

export function useSaveStationCamera(cageId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: StationCameraInput) =>
      (await getDashboardApi()).cages.saveCamera(cageId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.stationCamera(cageId) }),
  })
}
