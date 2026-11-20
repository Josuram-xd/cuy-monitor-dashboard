import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardApi } from '../api/DashboardApi'
import { createDemoMockApi, createMockApi } from './createMockApi'
import { MockDatabase } from './MockDatabase'

const PHOTO = { photo: '/9j/4AAQ', photoContentType: 'image/jpeg' as const }

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
      api.guineaPigs.register('cage-1', { ...PHOTO, markColor: 'RED' }),
    ).rejects.toMatchObject({ status: 409, code: 'conflict' })
  })

  it('registers a guinea pig as NORMAL with its photo and shows it in the cage health', async () => {
    const created = await api.guineaPigs.register('cage-1', { ...PHOTO, markColor: 'PURPLE' })

    expect(created).toMatchObject({
      markColor: 'PURPLE',
      status: 'NORMAL',
      photoUrl: 'data:image/jpeg;base64,/9j/4AAQ',
    })
    const health = await api.cages.getHealth('cage-1')
    expect(health.guineaPigs.map((g) => g.id)).toContain(created.id)
  })

  it('like the backend, asks for a photo of an accepted type and at most 300 KB', async () => {
    for (const photo of [
      { photo: '', photoContentType: 'image/jpeg' as const },
      { photo: '/9j/4AAQ', photoContentType: 'image/svg+xml' as never },
      { photo: 'A'.repeat(420_000), photoContentType: 'image/png' as const },
    ]) {
      await expect(
        api.guineaPigs.register('cage-1', { ...photo, markColor: 'GREEN' }),
      ).rejects.toMatchObject({ status: 400 })
    }
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
      api.guineaPigs.register('cage-1', { ...PHOTO, markColor: 'RED' }),
    ).resolves.toMatchObject({ markColor: 'RED' })
    await expect(api.guineaPigs.remove('cage-1', 999)).rejects.toMatchObject({ status: 404 })
    await expect(api.guineaPigs.remove('nope', 2)).rejects.toMatchObject({ status: 404 })
  })
})

describe('mock station camera', () => {
  // only the clock is faked: the mock's delays keep running on real timers
  afterEach(() => vi.useRealTimers())

  it('reports monitoring once the kit is connected, so the camera panel shows in demo mode', async () => {
    const api = createMockApi(undefined, 0)
    expect((await api.cages.getHealth('cage-1')).monitoring).toBeUndefined()
    await api.cages.setEquipment('cage-1', true)
    expect((await api.cages.getHealth('cage-1')).monitoring?.connectedAt).toBeTruthy()
    await api.cages.setEquipment('cage-1', false)
    expect((await api.cages.getHealth('cage-1')).monitoring).toBeUndefined()
  })

  it('flags the kit cage as monitored only while the kit is connected', async () => {
    const api = createMockApi(undefined, 0)
    expect((await api.cages.get('cage-1')).monitored).toBe(false)
    await api.cages.setEquipment('cage-1', true)
    expect((await api.cages.get('cage-1')).monitored).toBe(true)
    await api.cages.setEquipment('cage-1', false)
    expect((await api.cages.get('cage-1')).monitored).toBe(false)
  })

  it('creates the simulation cage once, with a guinea pig per clip color', async () => {
    const api = createMockApi(undefined, 0)
    const first = await api.cages.createSimulationCage()
    const second = await api.cages.createSimulationCage()

    expect(first).toMatchObject({ name: 'Simulación', simulated: true, monitored: false })
    expect(first.cageId).toMatch(/^sim-[0-9a-f]{8}$/)
    expect(second.cageId).toBe(first.cageId)
    const pigs = await api.guineaPigs.list(first.cageId)
    expect(pigs.map((g) => g.markColor)).toEqual(['RED', 'BLUE', 'GREEN'])
  })

  it('runs the video of the simulation cage, reports its credit, and stops it', async () => {
    const api = createMockApi(undefined, 0)
    const { cageId } = await api.cages.createSimulationCage()

    await api.cages.startSimulation(cageId)
    await api.cages.startSimulation(cageId)
    const running = await api.cages.getSimulationStatus(cageId)
    expect(running).toMatchObject({ running: true, framesSent: 0, frameCount: 180 })
    expect(running.credit?.license).toBe('CC BY 4.0')

    await api.cages.stopSimulation(cageId)
    expect((await api.cages.getSimulationStatus(cageId)).running).toBe(false)
  })

  it('answers 409 when two videos already run', async () => {
    const db = new MockDatabase()
    // one simulation cage per account, so the second one is put in the database directly
    db.cages.push({ ...structuredClone(db.cages[0]), cageId: 'sim-00000001', simulated: true })
    db.cages.push({ ...structuredClone(db.cages[0]), cageId: 'sim-00000002', simulated: true })
    const api = createMockApi(db, 0)
    await api.cages.startSimulation('sim-00000001')
    await api.cages.startSimulation('sim-00000002')
    db.cages.push({ ...structuredClone(db.cages[0]), cageId: 'sim-00000003', simulated: true })
    await expect(api.cages.startSimulation('sim-00000003')).rejects.toMatchObject({ status: 409 })
  })

  it('the demo has the kit connected and a simulation cage', async () => {
    const api = createDemoMockApi()
    const cages = await api.cages.list()

    expect(cages.find((c) => c.simulated)?.cageId).toBe('sim-demo1234')
    expect(cages.find((c) => c.cageId === 'cage-1')?.monitored).toBe(true)
  })

  it('goes from not configured to pending, then connected, and never keeps the password', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const api = createMockApi(undefined, 0)
    expect((await api.cages.getCamera('cage-1')).status).toBe('NOT_CONFIGURED')

    await api.cages.saveCamera('cage-1', {
      type: 'RTSP',
      host: '192.168.1.60',
      username: 'cuy',
      password: 'secreta',
    })
    const pending = await api.cages.getCamera('cage-1')
    expect(pending).toMatchObject({
      status: 'PENDING',
      port: 554,
      stream: 'stream2',
      hasPassword: true,
    })
    expect(pending).not.toHaveProperty('password')
    // still testing a few seconds later, connected after the mock's pending window
    vi.setSystemTime(Date.now() + 5_000)
    expect((await api.cages.getCamera('cage-1')).status).toBe('PENDING')
    vi.setSystemTime(Date.now() + 4_000)
    expect((await api.cages.getCamera('cage-1')).status).toBe('CONNECTED')
  })

  it('requires a password the first time an RTSP camera is saved', async () => {
    const api = createMockApi(undefined, 0)
    await expect(
      api.cages.saveCamera('cage-1', { type: 'RTSP', host: '192.168.1.60', username: 'cuy' }),
    ).rejects.toMatchObject({ status: 400 })
  })
})
