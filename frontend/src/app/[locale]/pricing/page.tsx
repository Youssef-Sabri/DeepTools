import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '@/dictionaries'
import PricingContent from '@/components/pricing/PricingContent'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) return {}
  const dict = await getDictionary(locale as Locale)
  return {
    title: dict.pricing.title,
    description: dict.pricing.subtitle,
  }
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()
  const dict = await getDictionary(locale as Locale)
  return <PricingContent dict={dict} locale={locale} />
}
