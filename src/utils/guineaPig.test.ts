import { describe, expect, it } from 'vitest'
import { guineaPigLabel, photoSrc } from './guineaPig'

describe('guinea pig helpers', () => {
  it('names a cuy by the color of its mark, which is unique in its cage', () => {
    expect(guineaPigLabel({ markColor: 'RED' })).toBe('Cuy Rojo')
    expect(guineaPigLabel({ markColor: 'PURPLE' })).toBe('Cuy Morado')
  })

  it('uses the photo path of the API, a data: URL as is, and nothing without a photo', () => {
    expect(photoSrc('/api/v1/cages/cage-1/guinea-pigs/1/photo')).toBe(
      '/api/v1/cages/cage-1/guinea-pigs/1/photo',
    )
    expect(photoSrc('data:image/jpeg;base64,AAAA')).toBe('data:image/jpeg;base64,AAAA')
    expect(photoSrc(null)).toBeNull()
  })
})
