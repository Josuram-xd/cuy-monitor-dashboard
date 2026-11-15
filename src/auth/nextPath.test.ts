import { describe, expect, it } from 'vitest'
import { safeNextPath } from './nextPath'

describe('safeNextPath', () => {
  it('keeps app paths', () => {
    expect(safeNextPath('/alerts')).toBe('/alerts')
  })

  it.each(['//evil.com', 'https://evil.com', '/\\evil.com', '', null, undefined])(
    'rejects %s',
    (next) => {
      expect(safeNextPath(next)).toBe('/')
    },
  )
})
