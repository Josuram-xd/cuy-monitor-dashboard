import { describe, expect, it } from 'vitest'
import type { BehaviorWindow, StatusTransition } from '../types/GuineaPig'
import {
  bucketWindows,
  normalStillRange,
  statusPeriods,
  summarizeBehavior,
  usualFeederPerHour,
} from './behaviorSeries'
import { BUCKET_MS } from './timeRange'

const HOUR = 3_600_000
const baseline = { avgStillSeconds: 20, avgFeederVisits: 0.5, avgGroupDistance: 0.4 }

function window(iso: string, stillSeconds: number, feederVisits = 0): BehaviorWindow {
  return { occurredAt: iso, stillSeconds, feederVisits, watererVisits: 0, avgGroupDistance: 0.4 }
}

describe('bucketWindows', () => {
  it('averages stillness and turns visits into visits per hour', () => {
    const points = bucketWindows(
      [
        window('2026-10-05T10:05:00Z', 10, 1),
        window('2026-10-05T10:40:00Z', 30, 0),
        window('2026-10-05T11:10:00Z', 50, 0),
      ],
      BUCKET_MS.today,
    )

    expect(points).toHaveLength(2)
    expect(points[0].stillSeconds).toBe(20)
    expect(points[0].feederPerHour).toBe(30)
    expect(points[1].stillSeconds).toBe(50)
    expect(points[1].time - points[0].time).toBe(HOUR)
  })

  it('keeps the buckets in time order whatever order the windows come in', () => {
    const points = bucketWindows(
      [window('2026-10-05T12:00:00Z', 5), window('2026-10-05T09:00:00Z', 5)],
      BUCKET_MS.today,
    )

    expect(points[0].time).toBeLessThan(points[1].time)
  })
})

describe('normal range', () => {
  it('goes from the usual stillness divided by the factor to it multiplied by the factor', () => {
    expect(normalStillRange(baseline)).toEqual([13.3, 30])
    expect(normalStillRange({ ...baseline, avgStillSeconds: 50 })[1]).toBe(60)
    expect(usualFeederPerHour(baseline)).toBe(30)
  })
})

describe('statusPeriods', () => {
  const from = Date.parse('2026-10-05T00:00:00Z')
  const to = Date.parse('2026-10-05T12:00:00Z')

  it('splits the range at each transition', () => {
    const transitions: StatusTransition[] = [
      {
        fromStatus: 'NORMAL',
        toStatus: 'OBSERVED',
        reason: '',
        occurredAt: '2026-10-05T04:00:00Z',
      },
      { fromStatus: 'OBSERVED', toStatus: 'ALERT', reason: '', occurredAt: '2026-10-05T08:00:00Z' },
    ]

    expect(statusPeriods(transitions, from, to, 'ALERT').map((p) => p.status)).toEqual([
      'NORMAL',
      'OBSERVED',
      'ALERT',
    ])
    expect(statusPeriods(transitions, from, to, 'ALERT')[2]).toMatchObject({
      start: Date.parse('2026-10-05T08:00:00Z'),
      end: to,
    })
  })

  it('without transitions it was in its current status the whole range', () => {
    expect(statusPeriods([], from, to, 'OBSERVED')).toEqual([
      { status: 'OBSERVED', start: from, end: to },
    ])
  })
})

describe('summarizeBehavior', () => {
  const at = (stillSeconds: number) => [
    { time: 0, stillSeconds, feederPerHour: 0, watererPerHour: 0 },
  ]

  it('compares the range with the normal band', () => {
    expect(summarizeBehavior([], baseline)).toBe('noData')
    expect(summarizeBehavior(at(45), baseline)).toBe('stillMore')
    expect(summarizeBehavior(at(5), baseline)).toBe('stillLess')
    expect(summarizeBehavior(at(20), baseline)).toBe('usual')
  })
})
