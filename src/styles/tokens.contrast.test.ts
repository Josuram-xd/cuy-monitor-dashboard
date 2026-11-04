/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// read as text: CSS imports are not loaded as strings in the test runner
const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

// WCAG 2.2: 4.5:1 for text, 3:1 for large text and for the marks that carry meaning (icons, borders of
// a status, the focus ring). Both themes are checked on every surface the text can sit on.
const TEXT = 4.5
const NON_TEXT = 3

function block(selector: string): Record<string, string> {
  const start = tokens.indexOf(`${selector} {`)
  const body = tokens.slice(start, tokens.indexOf('\n}', start))
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]),
  )
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const light = block(':root')
const dark = { ...light, ...block(":root[data-theme='dark']") }
const SURFACES = ['color-bg', 'color-surface', 'color-surface-raised', 'color-surface-overlay']
const STATUSES = ['normal', 'observed', 'alert', 'critical', 'unknown']

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme', (_, t) => {
  it.each(SURFACES)('text, muted text and links read on %s', (surface) => {
    expect(contrast(t['color-text'], t[surface])).toBeGreaterThanOrEqual(TEXT)
    expect(contrast(t['color-text-muted'], t[surface])).toBeGreaterThanOrEqual(TEXT)
    expect(contrast(t['color-primary'], t[surface])).toBeGreaterThanOrEqual(TEXT)
  })

  it.each(STATUSES)('the %s status label reads on its own tint', (status) => {
    expect(contrast(t[`status-${status}-fg`], t[`status-${status}-bg`])).toBeGreaterThanOrEqual(
      TEXT,
    )
  })

  it.each(STATUSES)('the %s status mark is visible on a card', (status) => {
    expect(contrast(t[`status-${status}-accent`], t['color-surface'])).toBeGreaterThanOrEqual(
      NON_TEXT,
    )
  })

  it('white text reads on the solid green of buttons and the header', () => {
    expect(contrast(t['color-on-primary'], t['color-primary-strong'])).toBeGreaterThanOrEqual(TEXT)
  })

  it('the focus ring stands out from the page', () => {
    expect(contrast(t['color-focus'], t['color-bg'])).toBeGreaterThanOrEqual(NON_TEXT)
  })
})

describe('dark theme elevation', () => {
  it('every level up is lighter than the one below (elevation by tone)', () => {
    const levels = SURFACES.map((s) => luminance(dark[s]))
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThan(levels[i - 1])
    }
  })

  it('never uses pure black or pure white for surfaces and text', () => {
    expect(dark['color-bg'].toLowerCase()).not.toBe('#000000')
    expect(dark['color-text'].toLowerCase()).not.toBe('#ffffff')
  })
})
