import { describe, expect, it } from 'vitest'
import { base64Bytes, fitInside, splitDataUrl } from './photo'

describe('photo', () => {
  it('shrinks only what is bigger than the box, keeping the proportions', () => {
    expect(fitInside(4032, 3024, 512)).toEqual({ width: 512, height: 384 })
    expect(fitInside(3024, 4032, 512)).toEqual({ width: 384, height: 512 })
    expect(fitInside(300, 200, 512)).toEqual({ width: 300, height: 200 })
    expect(fitInside(512, 512, 512)).toEqual({ width: 512, height: 512 })
  })

  it('counts the bytes of a base64 string without decoding it', () => {
    expect(base64Bytes('AAAA')).toBe(3)
    expect(base64Bytes('AAA=')).toBe(2)
    expect(base64Bytes('AA==')).toBe(1)
    expect(base64Bytes('A'.repeat(409_600))).toBe(307_200)
  })

  it('splits a data url into what the img tag and the backend need', () => {
    expect(splitDataUrl('data:image/jpeg;base64,abc123')).toEqual({
      dataUrl: 'data:image/jpeg;base64,abc123',
      base64: 'abc123',
      contentType: 'image/jpeg',
    })
  })
})
