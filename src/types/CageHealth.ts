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

// what stands out in a guinea pig's newest minute, compared with what is normal for it (backend BehaviorSymptom)
export type BehaviorSymptom = 'UNUSUAL' | 'VERY_STILL' | 'NOT_EATING' | 'APART'

export interface LiveObservation {
  guineaPigId: number
  color: string
  at: string
  window: {
    windowSeconds: number
    stillSeconds: number
    feederVisits: number
    watererVisits: number
    detectionConfidence: number
  }
  symptoms: BehaviorSymptom[]
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
    // the newest window of each guinea pig since the equipment was connected
    guineaPigs?: LiveObservation[]
  } | null
  updatedAt: string
}
