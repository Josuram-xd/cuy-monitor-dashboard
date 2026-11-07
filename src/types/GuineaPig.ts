import type { HealthStatus } from './HealthStatus'

export interface GuineaPig {
  id: number
  // the path of its photo (contract 3.3c); null for a cuy registered before photos existed.
  // There is no name: the breeder tells them apart by the photo and the mark
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

export type PhotoContentType = 'image/jpeg' | 'image/png' | 'image/webp'

export interface NewGuineaPig {
  // the image in base64, without the "data:" prefix, at most 300 KB once decoded
  photo: string
  photoContentType: PhotoContentType
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
