import { ApiError } from '../api/ApiError'
import type { DateRange } from '../types/DateRange'
import type { MockDatabase } from './MockDatabase'

const DAY = 24 * 60 * 60_000

// Base class for the mock APIs: same delay and same errors as the real backend.
export abstract class MockResource {
  protected readonly db: MockDatabase
  private readonly delayMs: number

  constructor(db: MockDatabase, delayMs = 300) {
    this.db = db
    this.delayMs = delayMs
  }

  protected respond<T>(data: T): Promise<T> {
    // a copy, so the caller can't change the "database" by accident
    return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), this.delayMs))
  }

  // fields: failing fields of a validation error, like the backend's 400
  protected fail(status: number, code: string, fields?: Record<string, string>): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new ApiError(status, code, undefined, fields)), this.delayMs),
    )
  }

  protected notFound(): Promise<never> {
    return this.fail(404, 'not_found')
  }

  // same default as the backend: the last 24 hours
  protected resolveRange(range: DateRange = {}): { from: string; to: string } {
    const to = range.to ?? new Date().toISOString()
    const from = range.from ?? new Date(Date.parse(to) - DAY).toISOString()
    return { from, to }
  }

  protected inRange(timestamp: string, from: string, to: string): boolean {
    const time = Date.parse(timestamp)
    return time >= Date.parse(from) && time <= Date.parse(to)
  }
}
