import type { Breed, CoatColor } from './GuineaPigProfile'
import type { HealthStatus } from './HealthStatus'
import type { MarkColor } from './MarkColor'

export interface GuineaPig {
  id: number
  name: string
  markColor: MarkColor
  status: HealthStatus
  statusSince: string
  // null for a cuy registered without them
  breed?: Breed | null
  coatColor?: CoatColor | null
  initialWeightGrams?: number | null
  notes?: string | null
}

export interface NewGuineaPig {
  name: string
  markColor: MarkColor
  breed?: Breed
  coatColor?: CoatColor
  initialWeightGrams?: number
  notes?: string
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
