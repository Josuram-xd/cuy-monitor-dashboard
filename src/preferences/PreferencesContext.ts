import { createContext } from 'react'
import type { Language, Preferences, Theme } from './storage'

export interface PreferencesApi extends Preferences {
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
}

export const PreferencesContext = createContext<PreferencesApi | null>(null)
