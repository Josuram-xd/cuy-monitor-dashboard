import type { Alert, AlertStatus } from '../types/Alert'
import { request } from './client'
import { withMocks } from './withMocks'

export function listAlerts(status?: AlertStatus, signal?: AbortSignal): Promise<Alert[]> {
  return withMocks(
    (mock) => mock.listAlerts(status),
    () => request<Alert[]>('/api/v1/alerts', { query: { status }, signal }),
  )
}

export function markAlertReviewed(id: number): Promise<Alert> {
  return withMocks(
    (mock) => mock.markAlertReviewed(id),
    () => request<Alert>(`/api/v1/alerts/${id}`, { method: 'PATCH', body: { status: 'REVIEWED' } }),
  )
}
