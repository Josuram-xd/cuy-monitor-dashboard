export const HEALTH_STATUSES = ['NORMAL', 'OBSERVED', 'ALERT', 'CRITICAL'] as const

export type HealthStatus = (typeof HEALTH_STATUSES)[number]

// UI only: no data yet or the connection is down. Never sent to the backend.
export type DisplayStatus = HealthStatus | 'UNKNOWN'

// the array is already ordered from best to worst
export function severity(status: HealthStatus): number {
  return HEALTH_STATUSES.indexOf(status)
}

export function worstStatus(statuses: HealthStatus[]): HealthStatus {
  return statuses.reduce<HealthStatus>((a, b) => (severity(b) > severity(a) ? b : a), 'NORMAL')
}
