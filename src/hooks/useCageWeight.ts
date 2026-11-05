import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { rangeFor, type RangePreset } from '../charts/timeRange'
import { LIVE_REFRESH_MS, queryKeys } from './queryKeys'

// Same rules as useGuineaPigHistory: keyed by the preset, the previous range stays while the next loads
export function useCageWeight(cageId: string, preset: RangePreset) {
  return useQuery({
    queryKey: queryKeys.cageWeight(cageId, preset),
    // the answer has no dates (the history's does): the range asked for goes along, for the time axis
    queryFn: async ({ signal }) => {
      const range = rangeFor(preset)
      const weight = await (await getDashboardApi()).cages.getWeight(cageId, range, signal)
      return { weight, ...range }
    },
    placeholderData: keepPreviousData,
    refetchInterval: preset === 'today' ? LIVE_REFRESH_MS : false,
  })
}
