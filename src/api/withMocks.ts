import { config } from '../config'
import type { MockApi } from '../mocks/api'

export function withMocks<T>(
  mock: (api: MockApi) => Promise<T>,
  real: () => Promise<T>,
): Promise<T> {
  if (!config.useMocks) {
    return real()
  }
  // dynamic import keeps the fake data out of the production bundle
  return import('../mocks/api').then(({ mockApi }) => mock(mockApi))
}
