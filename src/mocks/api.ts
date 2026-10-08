import { ApiError } from '../api/client'
import type { Alert, AlertStatus } from '../types/Alert'
import type { CageHealth } from '../types/CageHealth'
import type { DateRange } from '../types/DateRange'
import type { GuineaPig, GuineaPigHistory, NewGuineaPig } from '../types/GuineaPig'
import type { HealthStatus } from '../types/HealthStatus'
import type { CageWeight } from '../types/WeightReading'
import {
  mockAlerts,
  mockAudio,
  mockCageId,
  mockGuineaPigs,
  mockTransitions,
  mockWeightReadings,
  mockWindows,
} from './data'

const DELAY_MS = 300
const DAY = 24 * 60 * 60_000

const SEVERITY: Record<HealthStatus, number> = { NORMAL: 0, OBSERVED: 1, ALERT: 2, CRITICAL: 3 }

// in-memory copies so mutations (register, mark reviewed) last until the page reloads
const guineaPigs: GuineaPig[] = structuredClone(mockGuineaPigs)
const alerts: Alert[] = structuredClone(mockAlerts)
const weightReadings = mockWeightReadings()

function respond<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), DELAY_MS))
}

function fail(status: number, code: string): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new ApiError(status, code)), DELAY_MS))
}

function worst(statuses: HealthStatus[]): HealthStatus {
  return statuses.reduce<HealthStatus>((a, b) => (SEVERITY[b] > SEVERITY[a] ? b : a), 'NORMAL')
}

function resolveRange(range: DateRange): { from: string; to: string } {
  const to = range.to ?? new Date().toISOString()
  const from = range.from ?? new Date(Date.parse(to) - DAY).toISOString()
  return { from, to }
}

function inRange(timestamp: string, from: string, to: string): boolean {
  const time = Date.parse(timestamp)
  return time >= Date.parse(from) && time <= Date.parse(to)
}

export const mockApi = {
  getCageHealth(cageId: string): Promise<CageHealth> {
    if (cageId !== mockCageId) {
      return fail(404, 'not_found')
    }
    const lastStable = weightReadings.filter((r) => r.stable).at(-1) ?? null
    const weight = {
      status: 'NORMAL' as const,
      lastGrams: lastStable?.grams ?? null,
      lastMeasuredAt: lastStable?.measuredAt ?? null,
    }
    return respond({
      cageId,
      status: worst([...guineaPigs.map((g) => g.status), mockAudio.status, weight.status]),
      guineaPigs: guineaPigs.map(({ id, name, markColor, status }) => ({
        id,
        name,
        markColor,
        status,
      })),
      audio: mockAudio,
      weight,
      updatedAt: new Date().toISOString(),
    })
  },

  getCageWeight(cageId: string, range: DateRange): Promise<CageWeight> {
    if (cageId !== mockCageId) {
      return fail(404, 'not_found')
    }
    const { from, to } = resolveRange(range)
    return respond({
      cageId,
      readings: weightReadings.filter((r) => inRange(r.measuredAt, from, to)),
    })
  },

  listGuineaPigs(cageId: string): Promise<GuineaPig[]> {
    if (cageId !== mockCageId) {
      return fail(404, 'not_found')
    }
    return respond(guineaPigs)
  },

  registerGuineaPig(cageId: string, body: NewGuineaPig): Promise<GuineaPig> {
    if (cageId !== mockCageId) {
      return fail(404, 'not_found')
    }
    const name = body.name.trim()
    if (name.length === 0 || name.length > 100) {
      return fail(400, 'bad_request')
    }
    if (guineaPigs.some((g) => g.markColor === body.markColor)) {
      return fail(409, 'conflict')
    }
    const created: GuineaPig = {
      id: Math.max(0, ...guineaPigs.map((g) => g.id)) + 1,
      name,
      markColor: body.markColor,
      status: 'NORMAL',
      statusSince: new Date().toISOString(),
    }
    guineaPigs.push(created)
    return respond(created)
  },

  getGuineaPigHistory(id: number, range: DateRange): Promise<GuineaPigHistory> {
    if (!guineaPigs.some((g) => g.id === id)) {
      return fail(404, 'not_found')
    }
    const { from, to } = resolveRange(range)
    if (Date.parse(to) <= Date.parse(from)) {
      return fail(400, 'bad_request')
    }
    return respond({
      guineaPigId: id,
      from,
      to,
      transitions: (mockTransitions[id] ?? []).filter((t) => inRange(t.occurredAt, from, to)),
      windows: mockWindows(id).filter((w) => inRange(w.occurredAt, from, to)),
    })
  },

  listAlerts(status?: AlertStatus): Promise<Alert[]> {
    const result = status ? alerts.filter((a) => a.status === status) : alerts
    return respond([...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },

  markAlertReviewed(id: number): Promise<Alert> {
    const alert = alerts.find((a) => a.id === id)
    if (!alert) {
      return fail(404, 'not_found')
    }
    // already reviewed is a no-op, like the backend
    if (alert.status === 'OPEN') {
      alert.status = 'REVIEWED'
      alert.reviewedAt = new Date().toISOString()
    }
    return respond(alert)
  },
}

export type MockApi = typeof mockApi
