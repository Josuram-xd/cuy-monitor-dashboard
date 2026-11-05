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

    expect(reviewed.slice(0, 2).map((a) => a.id)).toEqual([6, 5])
    expect(reviewed.every((a) => a.status === 'REVIEWED')).toBe(true)
    expect(reviewed.map((a) => a.createdAt)).toEqual(
      [...reviewed.map((a) => a.createdAt)].sort().reverse(),
    )
  })

  it('gives the alert history a page at a time, with the rules of the backend', async () => {
    const to = new Date().toISOString()
    const from = new Date(Date.now() - 30 * 86_400_000).toISOString()

    const first = await api.alerts.history({ from, to }, 0, 10)
    const critical = await api.alerts.history({ from, to, level: 'CRITICAL' }, 0, 100)

    expect(first.items).toHaveLength(10)
    expect(first.totalItems).toBeGreaterThan(30)
    expect(first.hasNext).toBe(true)
    expect(critical.items.every((a) => a.level === 'CRITICAL')).toBe(true)
    await expect(api.alerts.history({}, 0, 500)).rejects.toMatchObject({ status: 400 })
    await expect(
      api.alerts.history({ from: '2026-01-01T00:00:00Z', to }, 0, 20),
    ).rejects.toMatchObject({ status: 400 })
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

  it('deletes a guinea pig: it leaves the list and frees its color; deleting it again is a 404', async () => {
    await api.guineaPigs.remove('cage-1', 1)

    const list = await api.guineaPigs.list('cage-1')
    expect(list.some((g) => g.id === 1)).toBe(false)
    // the color is free: a new cuy can wear it
    await expect(
      api.guineaPigs.register('cage-1', { name: 'Nueva', markColor: 'RED' }),
    ).resolves.toMatchObject({ markColor: 'RED' })
    await expect(api.guineaPigs.remove('cage-1', 999)).rejects.toMatchObject({ status: 404 })
    await expect(api.guineaPigs.remove('nope', 2)).rejects.toMatchObject({ status: 404 })
  })
})
