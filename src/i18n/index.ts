import i18next from 'i18next'
import es from './locales/es.json'

const DEFAULT_LANGUAGE = 'es'

void i18next.init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  resources: { es: { translation: es } },
  interpolation: { escapeValue: false },
})

export const t = i18next.t.bind(i18next)
export default i18next
