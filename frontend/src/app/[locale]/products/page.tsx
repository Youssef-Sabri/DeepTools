import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '@/dictionaries'
import ProductsContent from '@/components/products/ProductsContent'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) return {}
  const dict = await getDictionary(locale as Locale)
  return {
    title: dict.products.title,
    description: dict.products.subtitle,
  }
}

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(locale)) notFound()
  const dict = await getDictionary(locale as Locale)
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--line)] border-t-[var(--accent-blue)] animate-spin" />
            <p className="font-mono text-xs text-[var(--fg-muted)]">Loading catalog index...</p>
          </div>
        </div>
      }
    >
      <ProductsContent dict={dict} locale={locale} />
    </Suspense>
  )
}
