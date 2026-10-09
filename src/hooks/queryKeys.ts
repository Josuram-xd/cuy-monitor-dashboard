import type { AlertStatus } from '../types/Alert'

export const queryKeys = {
  profile: ['account', 'profile'] as const,
  cageHealth: (cageId: string) => ['cage', cageId, 'health'] as const,
  guineaPigs: (cageId: string) => ['cage', cageId, 'guinea-pigs'] as const,
  // invalidating ['alerts'] refreshes every status filter at once
  alerts: (status?: AlertStatus) => ['alerts', status ?? 'ALL'] as const,
}
