import type { Cage, CageInput } from '../../types/Cage'
import type { CageHealth } from '../../types/CageHealth'
import type { DateRange } from '../../types/DateRange'
import type { CageWeight } from '../../types/WeightReading'
import type { StationCamera, StationCameraInput } from '../../types/StationCamera'
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

  setEquipment(cageId: string, connect: boolean): Promise<void> {
    const path = `${this.path(cageId)}/equipment`
    return connect ? this.http.put<void>(path, undefined) : this.http.delete<void>(path)
  }

  startSimulation(cageId: string): Promise<void> {
    return this.http.post<void>(`${this.path(cageId)}/simulation`, undefined)
  }

  getCamera(cageId: string, signal?: AbortSignal): Promise<StationCamera> {
    return this.http.get<StationCamera>(`${this.path(cageId)}/equipment/camera`, { signal })
  }

  saveCamera(cageId: string, body: StationCameraInput): Promise<void> {
    return this.http.put<void>(`${this.path(cageId)}/equipment/camera`, body)
  }

  private path(cageId: string): string {
    return `/api/v1/cages/${encodeURIComponent(cageId)}`
  }
}
