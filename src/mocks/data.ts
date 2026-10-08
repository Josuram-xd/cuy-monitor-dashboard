import type { Alert } from '../types/Alert'
import type { GuineaPig, StatusTransition, BehaviorWindow } from '../types/GuineaPig'
import type { WeightReading } from '../types/WeightReading'

const MINUTE = 60_000

// relative to page load so the mock always looks recent
const now = Date.now()

function minutesAgo(minutes: number): string {
  return new Date(now - minutes * MINUTE).toISOString()
}

export const mockCageId = 'cage-1'

export const mockGuineaPigs: GuineaPig[] = [
  { id: 1, name: 'Canela', markColor: 'RED', status: 'OBSERVED', statusSince: minutesAgo(22) },
  { id: 2, name: 'Pelusa', markColor: 'BLUE', status: 'NORMAL', statusSince: minutesAgo(600) },
  { id: 3, name: 'Copito', markColor: 'WHITE', status: 'NORMAL', statusSince: minutesAgo(1440) },
  { id: 4, name: 'Chispa', markColor: 'ORANGE', status: 'ALERT', statusSince: minutesAgo(35) },
]

export const mockAudio = { status: 'NORMAL' as const, lastEventAt: minutesAgo(2) }

export const mockAlerts: Alert[] = [
  {
    id: 7,
    cageId: mockCageId,
    guineaPigId: 4,
    level: 'ALERT',
    type: 'BEHAVIOR',
    message: 'Chispa lleva mucho más tiempo quieta de lo normal',
    status: 'OPEN',
    createdAt: minutesAgo(35),
    reviewedAt: null,
  },
  {
    id: 6,
    cageId: mockCageId,
    guineaPigId: null,
    level: 'ALERT',
    type: 'WEIGHT',
    message: 'El peso de la jaula bajó más de lo esperado',
    status: 'REVIEWED',
    createdAt: minutesAgo(1300),
    reviewedAt: minutesAgo(1250),
  },
  {
    id: 5,
    cageId: mockCageId,
    guineaPigId: 1,
    level: 'CRITICAL',
    type: 'BEHAVIOR',
    message: 'Canela no se acercó al comedero en varias horas',
    status: 'REVIEWED',
    createdAt: minutesAgo(2900),
    reviewedAt: minutesAgo(2850),
  },
]

export const mockTransitions: Record<number, StatusTransition[]> = {
  1: [
    {
      fromStatus: 'NORMAL',
      toStatus: 'OBSERVED',
      reason: 'Anomalía en 3 ventanas seguidas',
      occurredAt: minutesAgo(22),
    },
  ],
  2: [],
  3: [],
  4: [
    {
      fromStatus: 'NORMAL',
      toStatus: 'OBSERVED',
      reason: 'Anomalía en 3 ventanas seguidas',
      occurredAt: minutesAgo(90),
    },
    {
      fromStatus: 'OBSERVED',
      toStatus: 'ALERT',
      reason: 'La anomalía siguió por más de 45 minutos',
      occurredAt: minutesAgo(35),
    },
  ],
}

// One window every 5 minutes for the last 24 hours. Values are made up but stable between reloads.
export function mockWindows(guineaPigId: number): BehaviorWindow[] {
  const windows: BehaviorWindow[] = []
  for (let minutes = 24 * 60; minutes >= 0; minutes -= 5) {
    const wave = Math.sin((minutes + guineaPigId * 37) / 90)
    const alertBoost = guineaPigId === 4 && minutes <= 90 ? 20 : 0
    windows.push({
      occurredAt: minutesAgo(minutes),
      stillSeconds: Math.round(Math.min(60, 25 + wave * 15 + alertBoost)),
      feederVisits: alertBoost ? 0 : Math.max(0, Math.round(1 + wave)),
      watererVisits: Math.max(0, Math.round(0.5 - wave)),
      avgGroupDistance: Number((0.5 + Math.abs(wave) * 0.3).toFixed(2)),
    })
  }
  return windows
}

// One reading every 30 minutes; every fourth one is taken while the cuyes move, so it is unstable.
export function mockWeightReadings(): WeightReading[] {
  const readings: WeightReading[] = []
  for (let minutes = 24 * 60, i = 0; minutes >= 0; minutes -= 30, i++) {
    const stable = i % 4 !== 3
    const grams = 3240 + Math.sin(minutes / 200) * 40 + (stable ? 0 : 180)
    readings.push({ grams: Number(grams.toFixed(1)), stable, measuredAt: minutesAgo(minutes) })
  }
  return readings
}
