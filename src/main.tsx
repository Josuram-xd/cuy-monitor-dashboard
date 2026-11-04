import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './auth/AuthProvider'
import { t } from './i18n'
import { PreferencesProvider } from './preferences/PreferencesProvider'
import { applyTheme, loadPreferences } from './preferences/storage'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/nunito'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/global.css'
import { queryClient } from './queryClient'
import App from './App.tsx'

// before the first paint, so a dark preference never flashes light
const preferences = loadPreferences()
applyTheme(preferences.theme)
document.documentElement.lang = preferences.language
document.title = t('app.title')

// nothing of the previous session stays in the cache after logging out
const clearServerData = () => queryClient.clear()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider onLogout={clearServerData}>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </PreferencesProvider>
  </StrictMode>,
)
