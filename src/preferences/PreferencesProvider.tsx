import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { changeLanguage } from '../i18n'
import { PreferencesContext } from './PreferencesContext'
import {
  applyTheme,
  loadPreferences,
  savePreferences,
  type Language,
  type Preferences,
  type Theme,
} from './storage'

// Holds the language and the appearance the person chose, applies them and remembers them on this device.
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)

  useEffect(() => {
    applyTheme(preferences.theme)
    savePreferences(preferences)
  }, [preferences])

  const setLanguage = useCallback((language: Language) => {
    void changeLanguage(language).then(() => setPreferences((p) => ({ ...p, language })))
  }, [])

  const setTheme = useCallback((theme: Theme) => setPreferences((p) => ({ ...p, theme })), [])

  const value = useMemo(
    () => ({ ...preferences, setLanguage, setTheme }),
    [preferences, setLanguage, setTheme],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
