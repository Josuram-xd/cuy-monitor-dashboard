// The person's display preferences: language and light/dark appearance. They are not secret and not
// tied to the session, so they live in localStorage (the session itself never does). Reading or writing
// can fail (private mode, blocked storage): then the defaults are used and nothing breaks.

export const LANGUAGES = ['es', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export interface Preferences {
  language: Language
  theme: Theme
}

const STORAGE_KEY = 'cuy-monitor.preferences'

// a browser set to English starts in English; everything else starts in Spanish
export function defaultLanguage(browserLanguage = globalThis.navigator?.language ?? ''): Language {
  return browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'es'
}

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme)
}

export function loadPreferences(): Preferences {
  const defaults: Preferences = { language: defaultLanguage(), theme: 'system' }
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (typeof stored !== 'object' || stored === null) {
      return defaults
    }
    const { language, theme } = stored as Record<string, unknown>
    return {
      language: isLanguage(language) ? language : defaults.language,
      theme: isTheme(theme) ? theme : defaults.theme,
    }
  } catch {
    return defaults
  }
}

export function savePreferences(preferences: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    // storage blocked: the choice still applies until the page is closed
  }
}

// "system" leaves it to prefers-color-scheme; "light" and "dark" force it (tokens.css reads data-theme)
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  if (theme === 'system') {
    delete root.dataset.theme
  } else {
    root.dataset.theme = theme
  }
}
