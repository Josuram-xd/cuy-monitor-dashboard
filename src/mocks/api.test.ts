import { describe, expect, it } from 'vitest'
import { mockApi } from './api'

describe('mockApi', () => {
  it('reports the worst guinea pig status as the cage status', async () => {
    const health = await mockApi.getCageHealth('cage-1')

    expect(health.status).toBe('ALERT')
    expect(health.guineaPigs).toHaveLength(4)
    expect(health.weight.lastGrams).not.toBeNull()
  })

  it('answers 404 for an unknown cage', async () => {
    await expect(mockApi.getCageHealth('cage-99')).rejects.toMatchObject({
      status: 404,
      code: 'not_found',
    })
  })

  it('rejects a mark color already used in the cage', async () => {
    await expect(
      mockApi.registerGuineaPig('cage-1', { name: 'Otro', markColor: 'RED' }),
    ).rejects.toMatchObject({ status: 409, code: 'conflict' })
  })

  it('registers a guinea pig as NORMAL', async () => {
    const created = await mockApi.registerGuineaPig('cage-1', {
      name: ' Nube ',
      markColor: 'PURPLE',
    })

    expect(created).toMatchObject({ name: 'Nube', markColor: 'PURPLE', status: 'NORMAL' })
    expect(await mockApi.listGuineaPigs('cage-1')).toContainEqual(created)
  })

  it('filters alerts by status, newest first', async () => {
    const reviewed = await mockApi.listAlerts('REVIEWED')

    expect(reviewed.every((a) => a.status === 'REVIEWED')).toBe(true)
    expect(reviewed.map((a) => a.id)).toEqual([6, 5])
  })

  it('marks an open alert as reviewed', async () => {
    const alert = await mockApi.markAlertReviewed(7)

    expect(alert.status).toBe('REVIEWED')
    expect(alert.reviewedAt).not.toBeNull()
    expect(await mockApi.listAlerts('OPEN')).toEqual([])
  })

  it('returns the last 24 hours of history by default', async () => {
    const history = await mockApi.getGuineaPigHistory(4, {})

    expect(history.transitions.map((t) => t.toStatus)).toEqual(['OBSERVED', 'ALERT'])
    expect(history.windows.length).toBeGreaterThan(0)
  })
})
