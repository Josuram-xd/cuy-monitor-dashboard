import type { AlertStatus } from '../types/Alert'

export const queryKeys = {
  profile: ['account', 'profile'] as const,
  catalog: ['catalog'] as const,
  cages: ['cages'] as const,
  // invalidating ['cage', cageId] refreshes the cage, its health and its cuyes at once
  cage: (cageId: string) => ['cage', cageId, 'info'] as const,
  cageHealth: (cageId: string) => ['cage', cageId, 'health'] as const,
  guineaPigs: (cageId: string) => ['cage', cageId, 'guinea-pigs'] as const,
  // invalidating ['alerts'] refreshes every status and cage filter at once
  alerts: (status?: AlertStatus, cageId?: string) =>
    ['alerts', status ?? 'ALL', cageId ?? 'ALL'] as const,
}
