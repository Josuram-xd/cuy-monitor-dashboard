import { useQuery } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import { setCatalog } from '../catalog/catalog'
import { queryKeys } from './queryKeys'

const ONE_HOUR = 60 * 60 * 1000

// The lists of the pickers. They change when the breeder adds a color in the database, not while
// the page is open, so once is enough; the answer also feeds the synchronous catalog store.
export function useCatalog() {
  return useQuery({
    queryKey: queryKeys.catalog,
    queryFn: async ({ signal }) => {
      const catalog = await (await getDashboardApi()).catalog.get(signal)
      setCatalog(catalog)
      return catalog
    },
    staleTime: ONE_HOUR,
  })
}
