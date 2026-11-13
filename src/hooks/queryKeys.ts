import type { RangePreset } from '../charts/timeRange'
import type { AlertHistoryFilter, AlertStatus } from '../types/Alert'

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
  // the admin panel. Saving an option also invalidates ['catalog'], which the pickers read
  adminCatalog: ['admin', 'catalog'] as const,
  adminUsers: ['admin', 'users'] as const,
  // invalidating ['alerts'] refreshes every status and cage filter at once
  alerts: (status?: AlertStatus, cageId?: string) =>
    ['alerts', status ?? 'ALL', cageId ?? 'ALL'] as const,
  // under ['alerts'] too: reviewing an alert also refreshes the history
  alertHistory: (filter: AlertHistoryFilter) => ['alerts', 'history', filter] as const,
}
