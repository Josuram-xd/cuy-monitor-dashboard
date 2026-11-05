import type { RangePreset } from '../charts/timeRange'
import type { AlertStatus } from '../types/Alert'

// without the live connection, what can change on its own (states, alerts) is asked again this often
export const LIVE_REFRESH_MS = 30_000

export const queryKeys = {
  profile: ['account', 'profile'] as const,
  catalog: ['catalog'] as const,
  cages: ['cages'] as const,
  // invalidating ['cage', cageId] refreshes the cage, its health and its guinea pigs at once
  cage: (cageId: string) => ['cage', cageId, 'info'] as const,
  cageHealth: (cageId: string) => ['cage', cageId, 'health'] as const,
  guineaPigs: (cageId: string) => ['cage', cageId, 'guinea-pigs'] as const,
  // under the cage too, so the refresh button of the cage also refreshes its charts
  cageWeight: (cageId: string, preset: RangePreset) => ['cage', cageId, 'weight', preset] as const,
  guineaPigHistory: (id: number, preset: RangePreset) =>
    ['guinea-pig', id, 'history', preset] as const,
  // invalidating ['alerts'] refreshes every status and cage filter at once
  alerts: (status?: AlertStatus, cageId?: string) =>
    ['alerts', status ?? 'ALL', cageId ?? 'ALL'] as const,
}
