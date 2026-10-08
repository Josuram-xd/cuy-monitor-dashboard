import type { AlertApi } from '../api/DashboardApi'
import type { Alert, AlertStatus } from '../types/Alert'
import { MockResource } from './MockResource'

export class MockAlertApi extends MockResource implements AlertApi {
  list(status?: AlertStatus): Promise<Alert[]> {
    const alerts = status ? this.db.alerts.filter((a) => a.status === status) : this.db.alerts
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
