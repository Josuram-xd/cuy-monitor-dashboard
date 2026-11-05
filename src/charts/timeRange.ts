import type { DateRange } from '../types/DateRange'

export const RANGE_PRESETS = ['today', 'week', 'month'] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]

const HOUR = 3_600_000
const DAY = 24 * HOUR

// how wide each point of a chart is: one 60 s window per point would be 43 200 points in a month
export const BUCKET_MS: Record<RangePreset, number> = {
  today: HOUR,
  week: 6 * HOUR,
  month: DAY,
}

// "today" is since local midnight, the way the breeder thinks of a day; the others count back from now
export function rangeFor(preset: RangePreset, now: number = Date.now()): Required<DateRange> {
  const to = new Date(now)
  let from: Date
  if (preset === 'today') {
    from = new Date(now)
    from.setHours(0, 0, 0, 0)
  } else {
    from = new Date(now - (preset === 'week' ? 7 : 30) * DAY)
  }
  return { from: from.toISOString(), to: to.toISOString() }
}

// the start of the bucket a moment falls in, aligned to local time so a day bucket starts at midnight
export function bucketStart(time: number, size: number): number {
  const offset = new Date(time).getTimezoneOffset() * 60_000
  return Math.floor((time - offset) / size) * size + offset
}

// one tick every 6 hours today, every day in a week, every week in a month
const TICK_MS: Record<RangePreset, number> = {
  today: 6 * HOUR,
  week: DAY,
  month: 7 * DAY,
}

// Round moments on the time axis (00:00, 06:00, 12:00… or local midnights) instead of whatever minute the
// range happened to start at
export function timeTicks(from: number, to: number, preset: RangePreset): number[] {
  const step = TICK_MS[preset]
  const ticks: number[] = []
  for (let tick = bucketStart(from, step) + step; tick < to; tick += step) {
    ticks.push(tick)
  }
  return ticks
}
