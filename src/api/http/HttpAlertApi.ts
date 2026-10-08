import type { Alert, AlertStatus } from '../../types/Alert'
import type { AlertApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

export class HttpAlertApi implements AlertApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  list(status?: AlertStatus, signal?: AbortSignal): Promise<Alert[]> {
    return this.http.get<Alert[]>('/api/v1/alerts', { query: { status }, signal })
  }

  markReviewed(id: number): Promise<Alert> {
    return this.http.patch<Alert>(`/api/v1/alerts/${id}`, { status: 'REVIEWED' })
  }
}
