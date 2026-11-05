import { describe, expect, it } from 'vitest'
import { stableReadings, weightChange, weightDomain, weightTicks } from './weightSeries'
import { rangeFor, timeTicks } from './timeRange'

describe('weight series', () => {
  const readings = [
    { grams: 3300, stable: true, measuredAt: '2026-10-05T12:00:00Z' },
    { grams: 3500, stable: false, measuredAt: '2026-10-05T11:00:00Z' },
    { grams: 3240, stable: true, measuredAt: '2026-10-05T10:00:00Z' },
  ]

  it('only draws stable readings, oldest first', () => {
    expect(stableReadings(readings).map((p) => p.grams)).toEqual([3240, 3300])
  })

  it('starts the axis near the lightest reading, not at zero', () => {
    expect(weightDomain(stableReadings(readings))).toEqual([3150, 3350])
  })

  it('tells the change between the first and the last stable reading', () => {
    expect(weightChange(stableReadings(readings))).toBe(60)
    expect(weightChange([])).toBeUndefined()
  })
})

describe('rangeFor', () => {
  const now = Date.parse('2026-10-05T15:30:00Z')

  it('counts a week and a month back from now', () => {
    expect(rangeFor('week', now)).toEqual({
      from: '2026-09-28T15:30:00.000Z',
      to: '2026-10-05T15:30:00.000Z',
    })
    expect(Date.parse(rangeFor('month', now).from)).toBe(now - 30 * 86_400_000)
  })

  it('starts today at local midnight', () => {
    const from = new Date(rangeFor('today', now).from)
    expect([from.getHours(), from.getMinutes()]).toEqual([0, 0])
  })
})

describe('ticks', () => {
  it('puts the weight ticks on round grams', () => {
    expect(weightTicks([3150, 3350])).toEqual([3150, 3200, 3250, 3300, 3350])
    expect(weightTicks([2000, 3000])).toEqual([2000, 2200, 2400, 2600, 2800, 3000])
  })

  it('puts the time ticks on round hours', () => {
    const from = new Date(2026, 9, 5, 0, 0).getTime()
    const ticks = timeTicks(from, from + 86_400_000, 'today').map((tick) =>
      new Date(tick).getHours(),
    )
    expect(ticks).toEqual([6, 12, 18])
  })
})
