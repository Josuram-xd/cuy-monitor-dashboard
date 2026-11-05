import type { BaselineProfile, BehaviorWindow, StatusTransition } from '../types/GuineaPig'
import type { HealthStatus } from '../types/HealthStatus'
import { bucketStart } from './timeRange'

// Same factor as the backend's still-factor: past this, being still starts to count as unusual
export const STILL_FACTOR = 1.5
const WINDOWS_PER_HOUR = 60

export interface BehaviorPoint {
  // start of the bucket, epoch ms
  time: number
  // average seconds still per minute in the bucket (0-60)
  stillSeconds: number
  // visits per hour, so a bucket of a day and one of an hour read the same
  feederPerHour: number
  watererPerHour: number
}

export interface StatusPeriod {
  status: HealthStatus
  start: number
  end: number
}

const round1 = (value: number) => Math.round(value * 10) / 10

export function bucketWindows(windows: BehaviorWindow[], size: number): BehaviorPoint[] {
  const buckets = new Map<number, BehaviorWindow[]>()
  for (const window of windows) {
    const key = bucketStart(Date.parse(window.occurredAt), size)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(window)
    } else {
      buckets.set(key, [window])
    }
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, inBucket]) => {
      const sum = (pick: (w: BehaviorWindow) => number) =>
        inBucket.reduce((total, w) => total + pick(w), 0)
      return {
        time,
        stillSeconds: round1(sum((w) => w.stillSeconds) / inBucket.length),
        feederPerHour: round1((sum((w) => w.feederVisits) / inBucket.length) * WINDOWS_PER_HOUR),
        watererPerHour: round1((sum((w) => w.watererVisits) / inBucket.length) * WINDOWS_PER_HOUR),
      }
    })
}

// The normal band of seconds still per minute, around what is usual for this guinea pig
export function normalStillRange(baseline: BaselineProfile): [number, number] {
  return [
    round1(baseline.avgStillSeconds / STILL_FACTOR),
    round1(Math.min(60, baseline.avgStillSeconds * STILL_FACTOR)),
  ]
}

export function usualFeederPerHour(baseline: BaselineProfile): number {
  return round1(baseline.avgFeederVisits * WINDOWS_PER_HOUR)
}

// The states the guinea pig went through in [from, to]. Before the first transition it was in that
// transition's fromStatus; with no transitions, in its current status the whole time.
export function statusPeriods(
  transitions: StatusTransition[],
  from: number,
  to: number,
  currentStatus: HealthStatus,
): StatusPeriod[] {
  const sorted = [...transitions].sort(
    (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt),
  )
  const periods: StatusPeriod[] = []
  let status = sorted[0]?.fromStatus ?? currentStatus
  let start = from
  for (const transition of sorted) {
    const at = Math.min(Math.max(Date.parse(transition.occurredAt), from), to)
    if (at > start) {
      periods.push({ status, start, end: at })
    }
    status = transition.toStatus
    start = at
  }
  if (to > start) {
    periods.push({ status, start, end: to })
  }
  return periods
}

export type BehaviorSummary = 'noData' | 'stillMore' | 'stillLess' | 'usual'

// The one-line reading above the chart: how the range compares with what is usual for it
export function summarizeBehavior(
  points: BehaviorPoint[],
  baseline: BaselineProfile,
): BehaviorSummary {
  if (points.length === 0) {
    return 'noData'
  }
  const average = points.reduce((total, p) => total + p.stillSeconds, 0) / points.length
  const [low, high] = normalStillRange(baseline)
  if (average > high) {
    return 'stillMore'
  }
  if (average < low) {
    return 'stillLess'
  }
  return 'usual'
}
