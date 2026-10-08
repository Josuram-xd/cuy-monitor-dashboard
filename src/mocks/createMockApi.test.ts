import { beforeEach, describe, expect, it } from 'vitest'
import type { DashboardApi } from '../api/DashboardApi'
import { createMockApi } from './createMockApi'

describe('mock API', () => {
  let api: DashboardApi

  beforeEach(() => {
    // fresh data and no delay for every test
    api = createMockApi(undefined, 0)
  })

  it('reports the worst guinea pig status as the cage status', async () => {
    const health = await api.cages.getHealth('cage-1')

    expect(health.status).toBe('ALERT')
    expect(health.guineaPigs).toHaveLength(4)
    expect(health.weight.lastGrams).not.toBeNull()
  })

  it('answers 404 for an unknown cage', async () => {
    await expect(api.cages.getHealth('cage-99')).rejects.toMatchObject({
      status: 404,
      code: 'not_found',
    })
  })

  it('rejects a mark color already used in the cage', async () => {
    await expect(
      api.guineaPigs.register('cage-1', { name: 'Otro', markColor: 'RED' }),
    ).rejects.toMatchObject({ status: 409, code: 'conflict' })
  })

  it('registers a guinea pig as NORMAL and shows it in the cage health', async () => {
    const created = await api.guineaPigs.register('cage-1', { name: ' Nube ', markColor: 'PURPLE' })

    expect(created).toMatchObject({ name: 'Nube', markColor: 'PURPLE', status: 'NORMAL' })
    const health = await api.cages.getHealth('cage-1')
    expect(health.guineaPigs.map((g) => g.name)).toContain('Nube')
  })

  it('filters alerts by status, newest first', async () => {
    const reviewed = await api.alerts.list('REVIEWED')

    expect(reviewed.map((a) => a.id)).toEqual([6, 5])
  })

  it('marks an open alert as reviewed', async () => {
    const alert = await api.alerts.markReviewed(7)

    expect(alert.status).toBe('REVIEWED')
    expect(alert.reviewedAt).not.toBeNull()
    expect(await api.alerts.list('OPEN')).toEqual([])
  })

  it('returns the last 24 hours of history by default', async () => {
    const history = await api.guineaPigs.getHistory(4)

    expect(history.transitions.map((t) => t.toStatus)).toEqual(['OBSERVED', 'ALERT'])
    expect(history.windows.length).toBeGreaterThan(0)
  })
})
