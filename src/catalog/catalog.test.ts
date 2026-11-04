import { afterEach, describe, expect, it } from 'vitest'
import { mockCatalog } from '../mocks/data'
import { catalogLabel, catalogOption, catalogOptions, resetCatalog, setCatalog } from './catalog'

afterEach(() => {
  setCatalog(mockCatalog)
})

describe('catalog', () => {
  it('reads the label and the color of a code', () => {
    expect(catalogOption('markColors', 'RED')).toEqual({
      code: 'RED',
      label: 'Rojo',
      hex: '#d62828',
    })
    expect(catalogLabel('breeds', 'TEDDY')).toBe('Teddy')
  })

  it('keeps the options in the order the database sends them', () => {
    expect(catalogOptions('markColors').map((o) => o.code)).toEqual([
      'RED',
      'BLUE',
      'GREEN',
      'YELLOW',
      'ORANGE',
      'PURPLE',
      'BLACK',
      'WHITE',
    ])
  })

  // a color retired in the database, or a guinea pig read before the catalog arrives
  it('falls back to the code itself when the option is not there', () => {
    expect(catalogOption('markColors', 'PINK')).toEqual({ code: 'PINK', label: 'PINK', hex: null })
    resetCatalog()
    expect(catalogLabel('markColors', 'RED')).toBe('RED')
    expect(catalogOptions('breeds')).toEqual([])
  })
})
