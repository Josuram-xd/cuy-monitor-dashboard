import type { HealthStatus } from './HealthStatus'

export type AlertStatus = 'OPEN' | 'REVIEWED'

export type AlertLevel = Extract<HealthStatus, 'ALERT' | 'CRITICAL'>

export type EventType = 'BEHAVIOR' | 'AUDIO' | 'WEIGHT'

export interface Alert {
  id: number
  cageId: string
  // null for cage-level alerts (AUDIO, WEIGHT)
  guineaPigId: number | null
  level: AlertLevel
  type: EventType
  message: string
  status: AlertStatus
  createdAt: string
  reviewedAt: string | null
}
