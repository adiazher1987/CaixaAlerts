import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Importación estática de todos los namespaces para bundle óptimo
import esCommon from '../locales/es/common.json'
import esAuth from '../locales/es/auth.json'
import esIncidents from '../locales/es/incidents.json'

import enCommon from '../locales/en/common.json'
import enAuth from '../locales/en/auth.json'
import enIncidents from '../locales/en/incidents.json'

import caCommon from '../locales/ca/common.json'
import caAuth from '../locales/ca/auth.json'
import caIncidents from '../locales/ca/incidents.json'

export const SUPPORTED_LANGUAGES = ['es', 'en', 'ca'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  es: 'Español',
  en: 'English',
  ca: 'Català',
}

export const DEFAULT_LANGUAGE: SupportedLanguage = 'es'
export const FALLBACK_LANGUAGE: SupportedLanguage = 'es'

export const resources = {
  es: { common: esCommon, auth: esAuth, incidents: esIncidents },
  en: { common: enCommon, auth: enAuth, incidents: enIncidents },
  ca: { common: caCommon, auth: caAuth, incidents: caIncidents },
}

export const initI18n = (language?: string) => {
  const lng = SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : DEFAULT_LANGUAGE

  void i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: FALLBACK_LANGUAGE,
    defaultNS: 'common',
    ns: ['common', 'auth', 'incidents'],
    interpolation: {
      escapeValue: false, // React ya escapa los valores
    },
    react: {
      useSuspense: false,
    },
  })

  return i18n
}

export default i18n
