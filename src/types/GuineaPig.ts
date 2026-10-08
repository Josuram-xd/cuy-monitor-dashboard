import type { HealthStatus } from './HealthStatus'
import type { MarkColor } from './MarkColor'

export interface GuineaPig {
  id: number
  name: string
  markColor: MarkColor
  status: HealthStatus
  statusSince: string
}

export interface NewGuineaPig {
  name: string
  markColor: MarkColor
}

export interface StatusTransition {
  fromStatus: HealthStatus
  toStatus: HealthStatus
  reason: string
  occurredAt: string
}

export interface BehaviorWindow {
  occurredAt: string
  stillSeconds: number
  feederVisits: number
  watererVisits: number
  avgGroupDistance: number
}

export interface GuineaPigHistory {
  guineaPigId: number
  from: string
  to: string
  transitions: StatusTransition[]
  windows: BehaviorWindow[]
}
