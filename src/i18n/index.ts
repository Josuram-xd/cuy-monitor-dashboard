import i18next from 'i18next'
import { loadPreferences, type Language } from '../preferences/storage'
import en from './locales/en.json'
import es from './locales/es.json'

// es is the reference: a key missing in another language falls back to Spanish
const FALLBACK_LANGUAGE: Language = 'es'

// how dates are written in each language
const DATE_LOCALES: Record<Language, string> = { es: 'es-CO', en: 'en-US' }

void i18next.init({
  lng: loadPreferences().language,
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: ['es', 'en'],
  resources: { es: { translation: es }, en: { translation: en } },
  interpolation: { escapeValue: false },
})

export const t = i18next.t.bind(i18next)

export function currentLanguage(): Language {
  return i18next.language === 'en' ? 'en' : 'es'
}

export function dateLocale(): string {
  return DATE_LOCALES[currentLanguage()]
}

// switches every text at once; the page title and <html lang> follow
export async function changeLanguage(language: Language): Promise<void> {
  await i18next.changeLanguage(language)
  document.documentElement.lang = language
  document.title = t('app.title')
}

export default i18next
