import type { HealthStatus } from './HealthStatus'

export interface GuineaPig {
  id: number
  name: string
  // codes of catalog_option, not values of an enum: the labels come from GET /api/v1/catalog
  markColor: string
  status: HealthStatus
  statusSince: string
  // null for a cuy registered without them
  breed?: string | null
  coatColor?: string | null
  initialWeightGrams?: number | null
  notes?: string | null
}

export interface NewGuineaPig {
  name: string
  markColor: string
  breed?: string
  coatColor?: string
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

// what is normal for this guinea pig, learned by the backend (its default until learned)
export interface BaselineProfile {
  avgStillSeconds: number
  avgFeederVisits: number
  avgGroupDistance: number
}

export interface GuineaPigHistory {
  guineaPigId: number
  from: string
  to: string
  transitions: StatusTransition[]
  windows: BehaviorWindow[]
  baseline: BaselineProfile
}
