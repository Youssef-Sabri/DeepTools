import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '@/dictionaries'
import RegisterContent from '@/components/auth/RegisterContent'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) return {}
  const dict = await getDictionary(locale as Locale)
  return { title: dict.auth.register.title }
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()
  const dict = await getDictionary(locale as Locale)
  return <RegisterContent dict={dict} locale={locale} />
}
