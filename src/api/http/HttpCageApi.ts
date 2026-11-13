import type { Cage, CageInput } from '../../types/Cage'
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

  list(signal?: AbortSignal): Promise<Cage[]> {
    return this.http.get<Cage[]>('/api/v1/cages', { signal })
  }

  get(cageId: string, signal?: AbortSignal): Promise<Cage> {
    return this.http.get<Cage>(this.path(cageId), { signal })
  }

  create(body: CageInput): Promise<Cage> {
    return this.http.post<Cage>('/api/v1/cages', body)
  }

  update(cageId: string, body: CageInput): Promise<Cage> {
    return this.http.put<Cage>(this.path(cageId), body)
  }

  remove(cageId: string): Promise<void> {
    return this.http.delete<void>(this.path(cageId))
  }

  getHealth(cageId: string, signal?: AbortSignal): Promise<CageHealth> {
    return this.http.get<CageHealth>(`${this.path(cageId)}/health`, { signal })
  }

  getWeight(cageId: string, range: DateRange = {}, signal?: AbortSignal): Promise<CageWeight> {
    return this.http.get<CageWeight>(`${this.path(cageId)}/weight`, { query: { ...range }, signal })
  }

  startSimulation(cageId: string): Promise<void> {
    return this.http.post<void>(`${this.path(cageId)}/simulation`, undefined)
  }

  private path(cageId: string): string {
    return `/api/v1/cages/${encodeURIComponent(cageId)}`
  }
}
