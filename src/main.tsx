import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './auth/AuthProvider'
import { t } from './i18n'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/nunito'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/global.css'
import { queryClient } from './queryClient'
import App from './App.tsx'

document.title = t('app.title')

// nothing of the previous session stays in the cache after logging out
const clearServerData = () => queryClient.clear()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider onLogout={clearServerData}>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
