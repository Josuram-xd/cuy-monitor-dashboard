import { useInfiniteQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { AlertHistoryFilter } from '../types/Alert'
import { queryKeys } from './queryKeys'

export const ALERT_HISTORY_PAGE_SIZE = 20

// The history one page at a time: "Cargar más" asks the next page. The filter carries its dates, fixed when the
// period was chosen, so every page is read from the same range and nothing jumps between pages.
export function useAlertHistory(filter: AlertHistoryFilter) {
  return useInfiniteQuery({
    queryKey: queryKeys.alertHistory(filter),
    queryFn: async ({ pageParam, signal }) =>
      (await getDashboardApi()).alerts.history(filter, pageParam, ALERT_HISTORY_PAGE_SIZE, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
}
