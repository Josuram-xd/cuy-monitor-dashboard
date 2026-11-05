import type { AlertApi } from '../api/DashboardApi'
import type { Alert, AlertHistoryFilter, AlertHistoryPage, AlertStatus } from '../types/Alert'
import { MockResource } from './MockResource'

const DAY = 86_400_000
const DEFAULT_HISTORY_DAYS = 7
const MAX_RANGE_DAYS = 31
const MAX_PAGE_SIZE = 100

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

  // the same rules as the backend (contract 3.9): last 7 days by default, at most 31, pages of 1 to 100
  history(filter: AlertHistoryFilter, page: number, size: number): Promise<AlertHistoryPage> {
    const to = filter.to ?? new Date().toISOString()
    const from = filter.from ?? new Date(Date.parse(to) - DEFAULT_HISTORY_DAYS * DAY).toISOString()
    const length = Date.parse(to) - Date.parse(from)
    const badLevel = filter.level !== undefined && !['ALERT', 'CRITICAL'].includes(filter.level)
    if (
      length <= 0 ||
      length > MAX_RANGE_DAYS * DAY ||
      page < 0 ||
      size < 1 ||
      size > MAX_PAGE_SIZE ||
      badLevel
    ) {
      return this.fail(400, 'bad_request')
    }
    if (filter.cageId !== undefined && !this.db.hasCage(filter.cageId)) {
      return this.notFound()
    }
    if (filter.guineaPigId !== undefined && !this.db.findGuineaPig(filter.guineaPigId)) {
      return this.notFound()
    }
    const matching = this.db.alerts
      .filter(
        (a) =>
          this.db.hasCage(a.cageId) &&
          (filter.cageId === undefined || a.cageId === filter.cageId) &&
          (filter.guineaPigId === undefined || a.guineaPigId === filter.guineaPigId) &&
          (filter.level === undefined || a.level === filter.level) &&
          (filter.type === undefined || a.type === filter.type) &&
          (filter.status === undefined || a.status === filter.status) &&
          this.inRange(a.createdAt, from, to),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    const totalPages = Math.ceil(matching.length / size)
    return this.respond({
      items: matching.slice(page * size, (page + 1) * size),
      page,
      size,
      totalItems: matching.length,
      totalPages,
      hasNext: page + 1 < totalPages,
      from,
      to,
    })
  }
}
