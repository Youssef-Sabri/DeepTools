import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '@/dictionaries'
import HomeContent from '@/components/home/HomeContent'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) return {}
  const dict = await getDictionary(locale as Locale)

  return {
    title: dict.metadata.siteName + ' — ' + dict.metadata.siteDescription,
    description: dict.hero.description,
    openGraph: {
      title: dict.metadata.siteName,
      description: dict.hero.description,
    },
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()

  const dict = await getDictionary(locale as Locale)

  return <HomeContent dict={dict} locale={locale} />
}
