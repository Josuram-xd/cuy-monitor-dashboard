import type { CageHealth } from '../../types/CageHealth'
import type { DateRange } from '../../types/DateRange'
import type { CageWeight } from '../../types/WeightReading'
import type { CageApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

export class HttpCageApi implements CageApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  getHealth(cageId: string, signal?: AbortSignal): Promise<CageHealth> {
    return this.http.get<CageHealth>(`${this.path(cageId)}/health`, { signal })
  }

  getWeight(cageId: string, range: DateRange = {}, signal?: AbortSignal): Promise<CageWeight> {
    return this.http.get<CageWeight>(`${this.path(cageId)}/weight`, { query: { ...range }, signal })
  }

  private path(cageId: string): string {
    return `/api/v1/cages/${encodeURIComponent(cageId)}`
  }
}
