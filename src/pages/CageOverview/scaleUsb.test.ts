import { describe, expect, it } from 'vitest'
import { identifyScaleLine } from './scaleUsb'

describe('scale serial diagnostics', () => {
  it.each([
    ['Lectura: -791', 'raw'],
    ['Lectura: 2391', 'raw'],
    ['El HX711 no responde. Revisa DT, SCK, 5V y GND.', 'sensor'],
    ['{"grams":0,"stable":true}', 'valid'],
    ['{"grams":9,"stable":false}', 'unstable'],
    ['{"grams":-1,"stable":true}', 'negative'],
    ['# tare done', null],
  ])('recognizes %s', (line, result) => {
    expect(identifyScaleLine(line!)).toBe(result)
  })
})
