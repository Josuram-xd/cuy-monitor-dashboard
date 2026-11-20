import type { HealthStatus } from './HealthStatus'

export interface CageGuineaPigStatus {
  id: number
  photoUrl: string | null
  markColor: string
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
  monitoring?: {
    observation?: {
      color: string
      windowSeconds: number
      stillSeconds: number
      detectionConfidence: number
    } | null
    connectedAt: string
    lastBehaviorAt: string | null
    lastAudioLabel: 'NORMAL' | 'DISTRESS' | null
  } | null
  updatedAt: string
}
