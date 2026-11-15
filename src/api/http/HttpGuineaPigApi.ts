import type { DateRange } from '../../types/DateRange'
import type {
  GuineaPig,
  GuineaPigHistory,
  GuineaPigPhotoRequest,
  NewGuineaPig,
} from '../../types/GuineaPig'
import type { GuineaPigApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

export class HttpGuineaPigApi implements GuineaPigApi {
  private readonly http: HttpClient
  // the photo path stays the same when the picture is replaced, so the browser would keep the old one:
  // a guinea pig whose photo changed in this session gets a stamp in its address
  private readonly photoStamps = new Map<number, number>()

  constructor(http: HttpClient) {
    this.http = http
  }

  list(cageId: string, signal?: AbortSignal): Promise<GuineaPig[]> {
    return this.http.get<GuineaPig[]>(this.cagePath(cageId), { signal }).then((list) =>
      list.map((g) => {
        const stamp = this.photoStamps.get(g.id)
        return stamp && g.photoUrl ? { ...g, photoUrl: `${g.photoUrl}?v=${stamp}` } : g
      }),
    )
  }

  register(cageId: string, body: NewGuineaPig): Promise<GuineaPig> {
    return this.http.post<GuineaPig>(this.cagePath(cageId), body)
  }

  remove(cageId: string, id: number): Promise<void> {
    return this.http.delete<void>(`${this.cagePath(cageId)}/${id}`)
  }

  async setPhoto(cageId: string, id: number, body: GuineaPigPhotoRequest): Promise<void> {
    await this.http.put<void>(`${this.cagePath(cageId)}/${id}/photo`, body)
    this.photoStamps.set(id, Date.now())
  }

  async removePhoto(cageId: string, id: number): Promise<void> {
    await this.http.delete<void>(`${this.cagePath(cageId)}/${id}/photo`)
    this.photoStamps.set(id, Date.now())
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
