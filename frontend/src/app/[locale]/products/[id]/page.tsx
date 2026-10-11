import { notFound } from 'next/navigation'
import { getDictionary, hasLocale, type Locale } from '@/dictionaries'
import type { Product } from '@/lib/types'
import ProductDetailContent from '@/components/products/ProductDetailContent'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

async function getProduct(id: string, locale: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}?lang=${locale}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || json
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  if (!hasLocale(locale)) return {}
  const product = await getProduct(id, locale)
  if (!product) return {}

  const name = locale === 'ar' && product.nameAr ? product.nameAr : product.name
  return {
    title: `${name} — DeepTools`,
    description: product.description,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  if (!hasLocale(locale)) notFound()

  const [dict, product] = await Promise.all([
    getDictionary(locale as Locale),
    getProduct(id, locale),
  ])

  if (!product) notFound()

  return (
    <ProductDetailContent
      product={product}
      locale={locale}
      dict={dict}
    />
  )
}
