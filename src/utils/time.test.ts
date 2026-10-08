import { describe, expect, it } from 'vitest'
import { formatRelative } from './time'

const NOW = Date.parse('2026-10-05T14:32:00Z')

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString()
}

describe('formatRelative', () => {
  it('says "hace un momento" under a minute', () => {
    expect(formatRelative(ago(30_000), NOW)).toBe('hace un momento')
  })

  it('uses minutes under an hour', () => {
    expect(formatRelative(ago(2 * 60_000), NOW)).toBe('hace 2 min')
  })

  it('uses hours under a day', () => {
    expect(formatRelative(ago(90 * 60_000), NOW)).toBe('hace 1 h')
  })

  it('switches to an absolute date after 24 hours', () => {
    const text = formatRelative(ago(25 * 60 * 60_000), NOW)

    expect(text).not.toMatch(/^hace/)
    expect(text).toMatch(/4/)
  })
})
