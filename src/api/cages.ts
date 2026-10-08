import type { CageHealth } from '../types/CageHealth'
import type { DateRange } from '../types/DateRange'
import type { CageWeight } from '../types/WeightReading'
import { request } from './client'
import { withMocks } from './withMocks'

const cagePath = (cageId: string) => `/api/v1/cages/${encodeURIComponent(cageId)}`

export function getCageHealth(cageId: string, signal?: AbortSignal): Promise<CageHealth> {
  return withMocks(
    (mock) => mock.getCageHealth(cageId),
    () => request<CageHealth>(`${cagePath(cageId)}/health`, { signal }),
  )
}

export function getCageWeight(
  cageId: string,
  range: DateRange = {},
  signal?: AbortSignal,
): Promise<CageWeight> {
  return withMocks(
    (mock) => mock.getCageWeight(cageId, range),
    () => request<CageWeight>(`${cagePath(cageId)}/weight`, { query: { ...range }, signal }),
  )
}
