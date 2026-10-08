import 'server-only'

const dictionaries = {
  en: () => import('./en.json').then((module) => module.default),
  ar: () => import('./ar.json').then((module) => module.default),
}

export type Locale = keyof typeof dictionaries
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>

export const locales: Locale[] = ['en', 'ar']
export const defaultLocale: Locale = 'en'

export const rtlLocales: Locale[] = ['ar']

export const isRtl = (locale: Locale) => rtlLocales.includes(locale)

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries

export const getDictionary = async (locale: Locale) => dictionaries[locale]()
