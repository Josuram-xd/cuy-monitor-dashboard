import { describe, expect, it } from 'vitest'
import source from './locales/es.json?raw'

// JSON.parse keeps the last of two equal keys without a word, so a second "account": {...} block
// silently deletes the first one. This reads the raw file and fails on any repeated key.
function duplicateKeys(source: string): string[] {
  const duplicates: string[] = []
  const scopes: Set<string>[] = []
  const path: string[] = []
  const token = /"((?:[^"\\]|\\.)*)"\s*(:)?|([{}])/g
  let match: RegExpExecArray | null
  let lastKey = ''
  while ((match = token.exec(source)) !== null) {
    if (match[3] === '{') {
      scopes.push(new Set())
      path.push(lastKey)
    } else if (match[3] === '}') {
      scopes.pop()
      path.pop()
    } else if (match[2] === ':') {
      const scope = scopes[scopes.length - 1]
      const key = match[1]
      if (scope.has(key)) {
        duplicates.push([...path.filter(Boolean), key].join('.'))
      }
      scope.add(key)
      lastKey = key
    }
  }
  return duplicates
}

describe('es.json', () => {
  it('has no repeated keys', () => {
    expect(duplicateKeys(source)).toEqual([])
  })

  it('the detector does find a repeated key', () => {
    expect(duplicateKeys('{"a": {"b": "1"}, "a": {"c": "2"}}')).toEqual(['a'])
    expect(duplicateKeys('{"a": {"b": "1", "b": "2"}}')).toEqual(['a.b'])
  })
})
