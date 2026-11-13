import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { queryKeys } from '../hooks/queryKeys'
import type { Alert } from '../types/Alert'
import type { CageHealth } from '../types/CageHealth'
import {
  applyLiveMessage,
  cageTopic,
  parseLiveMessage,
  refreshAfterReconnect,
} from './liveMessages'

const ALERT: Alert = {
  id: 7,
  cageId: 'cage-1',
  guineaPigId: null,
  level: 'ALERT',
  type: 'AUDIO',
  message: 'Se escucharon chillidos de angustia en la jaula',
  status: 'OPEN',
  createdAt: '2026-11-06T10:00:00Z',
  reviewedAt: null,
  aiNote: null,
  aiNoteAt: null,
}

function envelope(type: string, data: unknown) {
  return JSON.stringify({ type, cageId: 'cage-1', occurredAt: '2026-11-06T10:00:00Z', data })
}

describe('live messages', () => {
  it('names the topic of a cage by its code', () => {
    expect(cageTopic('cage-1')).toBe('/topic/cages/cage-1')
  })

  it('reads the envelopes of the contract and ignores anything else', () => {
    expect(parseLiveMessage(envelope('ALERT', ALERT))?.type).toBe('ALERT')
    expect(parseLiveMessage(envelope('SOMETHING_NEW', {}))).toBeNull()
    expect(parseLiveMessage('not json')).toBeNull()
    expect(parseLiveMessage('{"type":"ALERT"}')).toBeNull()
  })

  it('an alert refreshes its cage and the alerts, and is handed back to be announced', () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    const alert = applyLiveMessage(queryClient, parseLiveMessage(envelope('ALERT', ALERT))!)

    expect(alert).toEqual(ALERT)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cage', 'cage-1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['alerts'] })
  })

  it('a status change refreshes the cage and that guinea pig, without an announcement', () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const data = { guineaPigId: 3, fromStatus: 'NORMAL', toStatus: 'OBSERVED', reason: 'quieto' }

    expect(
      applyLiveMessage(queryClient, parseLiveMessage(envelope('STATUS_CHANGED', data))!),
    ).toBeNull()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cage', 'cage-1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['guinea-pig', 3] })
  })

  it('a cage summary goes straight into the cache', () => {
    const queryClient = new QueryClient()
    const health = { cageId: 'cage-1', status: 'OBSERVED' } as CageHealth

    applyLiveMessage(queryClient, parseLiveMessage(envelope('CAGE_HEALTH', health))!)

    expect(queryClient.getQueryData(queryKeys.cageHealth('cage-1'))).toEqual(health)
  })

  it('after a reconnection every cage and the alerts are asked again', () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    refreshAfterReconnect(queryClient)

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cage'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['alerts'] })
  })
})
