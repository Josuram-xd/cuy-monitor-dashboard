import { useContext } from 'react'
import { PreferencesContext, type PreferencesApi } from './PreferencesContext'

export function usePreferences(): PreferencesApi {
  const preferences = useContext(PreferencesContext)
  if (!preferences) {
    throw new Error('usePreferences must be used inside PreferencesProvider')
  }
  return preferences
}
