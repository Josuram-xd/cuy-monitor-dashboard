import { afterEach, describe, expect, it } from 'vitest'
import { applyTheme, defaultLanguage, loadPreferences, savePreferences } from './storage'

const KEY = 'cuy-monitor.preferences'

describe('preferences storage', () => {
  afterEach(() => {
    localStorage.setItem(KEY, JSON.stringify({ language: 'es', theme: 'system' }))
  })

  it('starts in English only for a browser in English', () => {
    expect(defaultLanguage('en-US')).toBe('en')
    expect(defaultLanguage('es-CO')).toBe('es')
    expect(defaultLanguage('pt-BR')).toBe('es')
  })

  it('remembers what was saved', () => {
    savePreferences({ language: 'en', theme: 'dark' })

    expect(loadPreferences()).toEqual({ language: 'en', theme: 'dark' })
  })

  it('ignores broken or unknown values', () => {
    localStorage.setItem(KEY, '{not json')
    expect(loadPreferences().theme).toBe('system')

    localStorage.setItem(KEY, JSON.stringify({ language: 'fr', theme: 'neon' }))
    expect(loadPreferences().theme).toBe('system')
    expect(['es', 'en']).toContain(loadPreferences().language)
  })

  it('marks the page only when a theme is forced', () => {
    const root = document.createElement('html')

    applyTheme('dark', root)
    expect(root.dataset.theme).toBe('dark')

    applyTheme('system', root)
    expect(root.dataset.theme).toBeUndefined()
  })
})
