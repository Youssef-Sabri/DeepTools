import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '@/dictionaries'
import ContactContent from '@/components/contact/ContactContent'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) return {}
  const dict = await getDictionary(locale as Locale)
  return {
    title: dict.contact.title,
    description: dict.contact.subtitle,
  }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()
  const dict = await getDictionary(locale as Locale)
  return <ContactContent dict={dict} locale={locale} />
}
