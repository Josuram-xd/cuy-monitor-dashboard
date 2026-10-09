import type { DateRange } from '../../types/DateRange'
import type { GuineaPig, GuineaPigHistory, NewGuineaPig } from '../../types/GuineaPig'
import type { GuineaPigApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

export class HttpGuineaPigApi implements GuineaPigApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  list(cageId: string, signal?: AbortSignal): Promise<GuineaPig[]> {
    return this.http.get<GuineaPig[]>(this.cagePath(cageId), { signal })
  }

  register(cageId: string, body: NewGuineaPig): Promise<GuineaPig> {
    return this.http.post<GuineaPig>(this.cagePath(cageId), body)
  }

  remove(cageId: string, id: number): Promise<void> {
    return this.http.delete<void>(`${this.cagePath(cageId)}/${id}`)
  }

  getHistory(id: number, range: DateRange = {}, signal?: AbortSignal): Promise<GuineaPigHistory> {
    return this.http.get<GuineaPigHistory>(`/api/v1/guinea-pigs/${id}/history`, {
      query: { ...range },
      signal,
    })
  }

  private cagePath(cageId: string): string {
    return `/api/v1/cages/${encodeURIComponent(cageId)}/guinea-pigs`
  }
}
