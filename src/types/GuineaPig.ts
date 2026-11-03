import type { HealthStatus } from './HealthStatus'

export interface GuineaPig {
  id: number
  // where the photo is served; null for a cuy registered before the photo existed
  photoUrl: string | null
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
  // the image in base64, already shrunk by the page (see utils/photo.ts)
  photo: string
  photoContentType: string
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

export interface GuineaPigHistory {
  guineaPigId: number
  from: string
  to: string
  transitions: StatusTransition[]
  windows: BehaviorWindow[]
}
