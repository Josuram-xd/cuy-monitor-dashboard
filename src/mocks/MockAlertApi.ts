import type { AlertApi } from '../api/DashboardApi'
import type { Alert, AlertStatus } from '../types/Alert'
import { MockResource } from './MockResource'

export class MockAlertApi extends MockResource implements AlertApi {
  list(status?: AlertStatus, cageId?: string): Promise<Alert[]> {
    if (cageId !== undefined && !this.db.hasCage(cageId)) {
      return this.notFound()
    }
    // like the backend: only the alerts of cages the account still has
    const alerts = this.db.alerts.filter(
      (a) =>
        this.db.hasCage(a.cageId) &&
        (status === undefined || a.status === status) &&
        (cageId === undefined || a.cageId === cageId),
    )
    return this.respond([...alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }

  markReviewed(id: number): Promise<Alert> {
    const alert = this.db.alerts.find((a) => a.id === id)
    if (!alert) {
      return this.notFound()
    }
    // already reviewed is a no-op, like the backend
    if (alert.status === 'OPEN') {
      alert.status = 'REVIEWED'
      alert.reviewedAt = new Date().toISOString()
    }
    return this.respond(alert)
  }
}
