import type { DateRange } from '../types/DateRange'
import type { GuineaPig, GuineaPigHistory, NewGuineaPig } from '../types/GuineaPig'
import { request } from './client'
import { withMocks } from './withMocks'

const cageGuineaPigsPath = (cageId: string) =>
  `/api/v1/cages/${encodeURIComponent(cageId)}/guinea-pigs`

export function listGuineaPigs(cageId: string, signal?: AbortSignal): Promise<GuineaPig[]> {
  return withMocks(
    (mock) => mock.listGuineaPigs(cageId),
    () => request<GuineaPig[]>(cageGuineaPigsPath(cageId), { signal }),
  )
}

export function registerGuineaPig(cageId: string, body: NewGuineaPig): Promise<GuineaPig> {
  return withMocks(
    (mock) => mock.registerGuineaPig(cageId, body),
    () => request<GuineaPig>(cageGuineaPigsPath(cageId), { method: 'POST', body }),
  )
}

export function getGuineaPigHistory(
  id: number,
  range: DateRange = {},
  signal?: AbortSignal,
): Promise<GuineaPigHistory> {
  return withMocks(
    (mock) => mock.getGuineaPigHistory(id, range),
    () =>
      request<GuineaPigHistory>(`/api/v1/guinea-pigs/${id}/history`, {
        query: { ...range },
        signal,
      }),
  )
}
