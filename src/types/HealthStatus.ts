export const HEALTH_STATUSES = ['NORMAL', 'OBSERVED', 'ALERT', 'CRITICAL'] as const

export type HealthStatus = (typeof HEALTH_STATUSES)[number]

// UI only: no data yet or the connection is down. Never sent to the backend.
export type DisplayStatus = HealthStatus | 'UNKNOWN'
