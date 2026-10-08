import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '@/dictionaries'
import TemplatesContent from '@/components/templates/TemplatesContent'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) return {}
  const dict = await getDictionary(locale as Locale)
  return {
    title: dict.templates.title,
    description: dict.templates.subtitle,
  }
}

export default async function TemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()
  const dict = await getDictionary(locale as Locale)
  return <TemplatesContent dict={dict} locale={locale} />
}
