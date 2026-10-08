import type { HealthStatus } from './HealthStatus'
import type { MarkColor } from './MarkColor'

export interface CageGuineaPigStatus {
  id: number
  name: string
  markColor: MarkColor
  status: HealthStatus
}

export interface AudioHealth {
  status: HealthStatus
  lastEventAt: string | null
}

export interface WeightHealth {
  status: HealthStatus
  lastGrams: number | null
  lastMeasuredAt: string | null
}

export interface CageHealth {
  cageId: string
  // worst status of its parts
  status: HealthStatus
  guineaPigs: CageGuineaPigStatus[]
  audio: AudioHealth
  weight: WeightHealth
  updatedAt: string
}
