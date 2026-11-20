import { describe, expect, it } from 'vitest'
import { identifyScaleLine, serialLines } from './scaleUsb'

function fakeReader(chunks: string[]) {
  const encoder = new TextEncoder()
  const queue = chunks.map((chunk) => ({ done: false, value: encoder.encode(chunk) }))
  return {
    read: async () => queue.shift() ?? { done: true, value: undefined },
  }
}

async function collect(reader: ReturnType<typeof fakeReader>) {
  const lines: string[] = []
  for await (const line of serialLines(reader)) lines.push(line)
  return lines
}

describe('serialLines', () => {
  it('joins a line split across chunks and drops the unfinished tail', async () => {
    const lines = await collect(fakeReader(['{"grams":1', '2,"stable":true}\n# x\n', 'tail']))
    expect(lines).toEqual(['{"grams":12,"stable":true}', '# x'])
  })

  it('yields nothing from an empty stream', async () => {
    expect(await collect(fakeReader([]))).toEqual([])
  })
})

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
