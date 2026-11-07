import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '../hooks/queryKeys'
import type { Alert } from '../types/Alert'
import type { CageHealth } from '../types/CageHealth'

// What the backend sends on /topic/cages/{cageId} (contract: cuy-monitor-backend rest-api.md, section 4).
// The messages only say "something changed": REST stays the source of truth, so the screen is refreshed
// from it, except CAGE_HEALTH, which already carries the whole summary of the cage.
export type LiveMessage =
  | { type: 'ALERT'; cageId: string; occurredAt: string; data: Alert }
  | {
      type: 'STATUS_CHANGED'
      cageId: string
      occurredAt: string
      data: { guineaPigId: number; fromStatus: string; toStatus: string; reason: string }
    }
  | { type: 'CAGE_HEALTH'; cageId: string; occurredAt: string; data: CageHealth }

export function cageTopic(cageId: string): string {
  return `/topic/cages/${cageId}`
}

export function parseLiveMessage(body: string): LiveMessage | null {
  try {
    const message: unknown = JSON.parse(body)
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      'cageId' in message &&
      typeof message.cageId === 'string' &&
      (message.type === 'ALERT' ||
        message.type === 'STATUS_CHANGED' ||
        message.type === 'CAGE_HEALTH')
    ) {
      return message as LiveMessage
    }
  } catch {
    // not JSON: ignored, like any message of a type this version does not know
  }
  return null
}

// Brings the cache up to date with one message and returns the alert to announce, if there is one.
export function applyLiveMessage(queryClient: QueryClient, message: LiveMessage): Alert | null {
  const cage = ['cage', message.cageId]
  switch (message.type) {
    case 'CAGE_HEALTH':
      queryClient.setQueryData(queryKeys.cageHealth(message.cageId), message.data)
      return null
    case 'STATUS_CHANGED':
      void queryClient.invalidateQueries({ queryKey: cage })
      void queryClient.invalidateQueries({ queryKey: ['guinea-pig', message.data.guineaPigId] })
      return null
    case 'ALERT':
      void queryClient.invalidateQueries({ queryKey: cage })
      void queryClient.invalidateQueries({ queryKey: ['alerts'] })
      return message.data
  }
}

// after a reconnection: what was sent while disconnected is not replayed, so ask REST again
export function refreshAfterReconnect(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['cage'] })
  void queryClient.invalidateQueries({ queryKey: ['alerts'] })
}
