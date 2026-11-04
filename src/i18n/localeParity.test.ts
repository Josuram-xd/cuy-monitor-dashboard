import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import es from './locales/es.json'

type Tree = { [key: string]: string | Tree }

// every text key, with the plural forms of each language folded into one ("x_one", "x_many" -> "x")
function keys(tree: Tree, prefix = ''): Set<string> {
  const found = new Set<string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix + key.replace(/_(zero|one|two|few|many|other)$/, '')
    if (typeof value === 'string') {
      found.add(path)
    } else {
      keys(value, `${path}.`).forEach((k) => found.add(k))
    }
  }
  return found
}

function placeholders(tree: Tree): Map<string, string[]> {
  const found = new Map<string, string[]>()
  const walk = (node: Tree, prefix: string) => {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix + key.replace(/_(zero|one|two|few|many|other)$/, '')
      if (typeof value === 'string') {
        found.set(path, (value.match(/{{\w+}}/g) ?? []).sort())
      } else {
        walk(value, `${path}.`)
      }
    }
  }
  walk(tree, '')
  return found
}

describe('locale parity', () => {
  it('has every Spanish text in English and nothing extra', () => {
    expect([...keys(en as Tree)].sort()).toEqual([...keys(es as Tree)].sort())
  })

  it('keeps the same placeholders in both languages', () => {
    const spanish = placeholders(es as Tree)
    for (const [key, values] of placeholders(en as Tree)) {
      expect(values, key).toEqual(spanish.get(key))
    }
  })
})
