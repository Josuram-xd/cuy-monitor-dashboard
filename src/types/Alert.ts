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

// what the history is asked for; every field is optional, like in the backend (contract 3.9)
export interface AlertHistoryFilter {
  cageId?: string
  guineaPigId?: number
  level?: AlertLevel
  type?: EventType
  status?: AlertStatus
  from?: string
  to?: string
}

export interface AlertHistoryPage {
  items: Alert[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  from: string
  to: string
}
