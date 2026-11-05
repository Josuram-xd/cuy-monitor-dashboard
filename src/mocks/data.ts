import type { Alert } from '../types/Alert'
import type { Catalog } from '../types/Catalog'
import type { Cage } from '../types/Cage'
import type {
  BaselineProfile,
  BehaviorWindow,
  GuineaPig,
  StatusTransition,
} from '../types/GuineaPig'
import type { WeightReading } from '../types/WeightReading'

const MINUTE = 60_000

// relative to page load so the mock always looks recent
const now = Date.now()

function minutesAgo(minutes: number): string {
  return new Date(now - minutes * MINUTE).toISOString()
}

export const mockCageId = 'cage-1'
export const mockSecondCageId = 'cage-7f3a9c21'

export const mockCages: Cage[] = [
  {
    cageId: mockCageId,
    name: 'Jaula piloto',
    location: 'Galpón',
    createdAt: minutesAgo(60 * 24 * 30),
  },
  {
    cageId: mockSecondCageId,
    name: 'Jaula del patio',
    location: 'Patio trasero',
    createdAt: minutesAgo(60 * 24 * 3),
  },
]

// the second cage: two calm guinea pigs, so the list of cages shows different states
export const mockSecondCageGuineaPigs: GuineaPig[] = [
  { id: 21, name: 'Tofu', markColor: 'WHITE', status: 'NORMAL', statusSince: minutesAgo(300) },
  { id: 22, name: 'Mora', markColor: 'PURPLE', status: 'NORMAL', statusSince: minutesAgo(900) },
]

// The same rows migration V10 of cuy-monitor-db inserts, in the same order.
export const mockCatalog: Catalog = {
  markColors: [
    { code: 'RED', label: 'Rojo', hex: '#d62828' },
    { code: 'BLUE', label: 'Azul', hex: '#1e63d6' },
    { code: 'GREEN', label: 'Verde', hex: '#2e9e44' },
    { code: 'YELLOW', label: 'Amarillo', hex: '#f5c518' },
    { code: 'ORANGE', label: 'Naranja', hex: '#f77f00' },
    { code: 'PURPLE', label: 'Morado', hex: '#7b3fb5' },
    { code: 'BLACK', label: 'Negro', hex: '#1a1a1a' },
    { code: 'WHITE', label: 'Blanco', hex: '#ffffff' },
  ],
  coatColors: [
    { code: 'WHITE', label: 'Blanco', hex: '#ffffff' },
    { code: 'BLACK', label: 'Negro', hex: '#2a2623' },
    { code: 'BROWN', label: 'Café', hex: '#8b5a3c' },
    { code: 'CREAM', label: 'Crema', hex: '#f3e2bd' },
    { code: 'GRAY', label: 'Gris', hex: '#a6a6a6' },
    { code: 'CINNAMON', label: 'Canela', hex: '#c9763d' },
    { code: 'BICOLOR', label: 'Bicolor', hex: '#8b5a3c' },
    { code: 'TRICOLOR', label: 'Tricolor', hex: '#c9763d' },
  ],
  breeds: [
    { code: 'AMERICAN', label: 'Americano', hex: null },
    { code: 'PERUVIAN', label: 'Peruano', hex: null },
    { code: 'ABYSSINIAN', label: 'Abisinio', hex: null },
    { code: 'TEDDY', label: 'Teddy', hex: null },
    { code: 'SILKIE', label: 'Sedoso (Silkie)', hex: null },
    { code: 'SKINNY', label: 'Skinny (sin pelo)', hex: null },
    { code: 'CRESTED', label: 'Crestado', hex: null },
    { code: 'OTHER', label: 'Otra o mestizo', hex: null },
  ],
}

export const mockGuineaPigs: GuineaPig[] = [
  {
    id: 1,
    name: 'Canela',
    markColor: 'RED',
    status: 'OBSERVED',
    statusSince: minutesAgo(22),
    breed: 'TEDDY',
    coatColor: 'CINNAMON',
    initialWeightGrams: 860,
    notes: 'La más curiosa de la jaula.',
  },
  {
    id: 2,
    name: 'Pelusa',
    markColor: 'BLUE',
    status: 'NORMAL',
    statusSince: minutesAgo(600),
    breed: 'PERUVIAN',
    coatColor: 'CREAM',
    initialWeightGrams: 940,
    notes: null,
  },
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

const HISTORY_MESSAGES: Record<Alert['type'], string[]> = {
  BEHAVIOR: [
    'Estuvo quieto mucho más tiempo de lo habitual y no fue al comedero',
    'Se alejó del grupo durante mucho tiempo',
    'Su comportamiento fue anómalo varios minutos seguidos',
  ],
  AUDIO: ['Se escucharon chillidos de angustia en la jaula'],
  WEIGHT: ['El peso de la jaula bajó más de lo esperado'],
}

// 30 days of reviewed alerts, about one every 19 hours, so the history has pages to go through.
// Ids from 100 on, so they never clash with the alerts above. Only Canela (1) and Chispa (4): Pelusa stays calm.
export function mockAlertHistory(): Alert[] {
  const history: Alert[] = []
  for (let n = 3; n <= 37; n++) {
    const type: Alert['type'] = n % 6 === 0 ? 'AUDIO' : n % 6 === 3 ? 'WEIGHT' : 'BEHAVIOR'
    const messages = HISTORY_MESSAGES[type]
    const minutes = n * 19 * 60 + (n % 7) * 13
    history.push({
      id: 100 + n,
      cageId: n % 9 === 0 ? mockSecondCageId : mockCageId,
      guineaPigId: type === 'BEHAVIOR' && n % 9 !== 0 ? (n % 2 === 0 ? 1 : 4) : null,
      level: n % 5 === 0 ? 'CRITICAL' : 'ALERT',
      type: n % 9 === 0 ? 'AUDIO' : type,
      message: n % 9 === 0 ? HISTORY_MESSAGES.AUDIO[0] : messages[n % messages.length],
      status: 'REVIEWED',
      createdAt: minutesAgo(minutes),
      reviewedAt: minutesAgo(minutes - 25 - (n % 4) * 20),
    })
  }
  return history
}

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

// the backend's default profile, a little different per guinea pig as if it had been learned
export function mockBaseline(guineaPigId: number): BaselineProfile {
  return {
    avgStillSeconds: 24 + (guineaPigId % 3) * 2,
    avgFeederVisits: 0.4,
    avgGroupDistance: 0.55,
  }
}

const HISTORY_DAYS = 30

// minutes ago of each sample: every `recent` minutes for the last day, every `older` minutes before that,
// so 30 days of history stay light
function sampleTimes(recent: number, older: number): number[] {
  const times: number[] = []
  for (let minutes = HISTORY_DAYS * 24 * 60; minutes > 24 * 60; minutes -= older) {
    times.push(minutes)
  }
  for (let minutes = 24 * 60; minutes >= 0; minutes -= recent) {
    times.push(minutes)
  }
  return times
}

// 30 days of 60 s windows: one every 5 minutes for the last day, every hour before. Made up but stable.
export function mockWindows(guineaPigId: number): BehaviorWindow[] {
  const windows: BehaviorWindow[] = []
  for (const minutes of sampleTimes(5, 60)) {
    const wave = Math.sin((minutes + guineaPigId * 37) / 90)
    const alertBoost = guineaPigId === 4 && minutes <= 90 ? 20 : 0
    windows.push({
      occurredAt: minutesAgo(minutes),
      stillSeconds: Math.round(Math.min(60, 25 + wave * 15 + alertBoost)),
      // a visit in a 60 s window is the exception, not the rule
      feederVisits: alertBoost || wave < 0.3 ? 0 : 1,
      watererVisits: wave < -0.6 ? 1 : 0,
      avgGroupDistance: Number((0.5 + Math.abs(wave) * 0.3).toFixed(2)),
    })
  }
  return windows
}

// 30 days of readings, every 30 minutes for the last day and every 3 hours before; every fourth one is
// taken while the guinea pigs move, so it is unstable. The cage gains a little weight over the month.
export function mockWeightReadings(): WeightReading[] {
  const readings: WeightReading[] = []
  for (const [i, minutes] of sampleTimes(30, 180).entries()) {
    const stable = i % 4 !== 3
    const growth = ((HISTORY_DAYS * 24 * 60 - minutes) / (24 * 60)) * 4
    const grams = 3120 + growth + Math.sin(minutes / 200) * 40 + (stable ? 0 : 180)
    readings.push({ grams: Number(grams.toFixed(1)), stable, measuredAt: minutesAgo(minutes) })
  }
  return readings
}
