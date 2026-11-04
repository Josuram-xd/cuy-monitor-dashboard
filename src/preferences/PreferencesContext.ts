import { createContext } from 'react'
import type { Point } from '../motion/themeTransition'
import type { Language, Preferences, Theme } from './storage'

export interface PreferencesApi extends Preferences {
  setLanguage: (language: Language) => void
  // origin: where the person clicked, so the new theme opens from there
  setTheme: (theme: Theme, origin?: Point) => void
}

export const PreferencesContext = createContext<PreferencesApi | null>(null)
