import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { t } from './i18n'
import './index.css'
import App from './App.tsx'

document.title = t('app.title')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
