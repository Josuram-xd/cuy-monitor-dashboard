import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { rangeFor, type RangePreset } from '../charts/timeRange'
import { LIVE_REFRESH_MS, queryKeys } from './queryKeys'

// The key is the preset, not the dates: the dates are worked out when asking, so "today" doesn't
// become a new query every second. While another range loads, the chart keeps the previous one.
export function useGuineaPigHistory(id: number, preset: RangePreset) {
  return useQuery({
    queryKey: queryKeys.guineaPigHistory(id, preset),
    queryFn: async ({ signal }) =>
      (await getDashboardApi()).guineaPigs.getHistory(id, rangeFor(preset), signal),
    placeholderData: keepPreviousData,
    // only today is still being written; a week or a month barely change in 30 s
    refetchInterval: preset === 'today' ? LIVE_REFRESH_MS : false,
  })
}
