import type { WeightReading } from '../types/WeightReading'

export interface WeightPoint {
  time: number
  grams: number
}

// A reading taken while the guinea pigs moved on the scale says nothing: only stable ones are drawn
export function stableReadings(readings: WeightReading[]): WeightPoint[] {
  return readings
    .filter((reading) => reading.stable)
    .map((reading) => ({ time: Date.parse(reading.measuredAt), grams: reading.grams }))
    .sort((a, b) => a.time - b.time)
}

// The y-axis starts near the lightest reading, not at 0: a cage of 3 kg that gains 50 g has to show it
export function weightDomain(points: WeightPoint[], step = 50): [number, number] {
  if (points.length === 0) {
    return [0, step]
  }
  const grams = points.map((p) => p.grams)
  const low = Math.floor(Math.min(...grams) / step) * step - step
  const high = Math.ceil(Math.max(...grams) / step) * step + step
  return [Math.max(0, low), high]
}

// grams gained (positive) or lost between the first and the last stable reading
export function weightChange(points: WeightPoint[]): number | undefined {
  if (points.length < 2) {
    return undefined
  }
  return Math.round(points[points.length - 1].grams - points[0].grams)
}

// ticks on round grams: every 50 g for a small span, 100 g or more for a bigger one, about 5 of them
export function weightTicks([low, high]: [number, number]): number[] {
  const step = [50, 100, 200, 500, 1000].find((size) => (high - low) / size <= 5) ?? 1000
  const ticks: number[] = []
  for (let tick = Math.ceil(low / step) * step; tick <= high; tick += step) {
    ticks.push(tick)
  }
  return ticks
}
