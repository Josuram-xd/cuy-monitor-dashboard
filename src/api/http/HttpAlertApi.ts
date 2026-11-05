import type { Alert, AlertHistoryFilter, AlertHistoryPage, AlertStatus } from '../../types/Alert'
import type { AlertApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

export class HttpAlertApi implements AlertApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  list(status?: AlertStatus, cageId?: string, signal?: AbortSignal): Promise<Alert[]> {
    return this.http.get<Alert[]>('/api/v1/alerts', { query: { status, cageId }, signal })
  }

  markReviewed(id: number): Promise<Alert> {
    return this.http.patch<Alert>(`/api/v1/alerts/${id}`, { status: 'REVIEWED' })
  }

  history(
    filter: AlertHistoryFilter,
    page: number,
    size: number,
    signal?: AbortSignal,
  ): Promise<AlertHistoryPage> {
    return this.http.get<AlertHistoryPage>('/api/v1/alerts/history', {
      query: {
        ...filter,
        guineaPigId: filter.guineaPigId === undefined ? undefined : String(filter.guineaPigId),
        page: String(page),
        size: String(size),
      },
      signal,
    })
  }
}
