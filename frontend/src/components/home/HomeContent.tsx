'use client'

import { useState, useEffect } from 'react'
import {
  Terminal,
  ArrowRight,
  Code2,
} from 'lucide-react'
import Link from 'next/link'
import type { Product, License } from '@/lib/types'
import { fetchApi, downloadProductFile } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { CartDrawer } from '@/components/marketplace/CartDrawer'
import { DownloadOverlay } from '@/components/marketplace/DownloadOverlay'
import { formatBytes, formatCents, formatDate } from '@/lib/utils'
import { useDictionary } from '@/components/providers/DictionaryProvider'

interface HomeContentProps {
  locale: string
}

export default function HomeContent({ locale }: HomeContentProps) {
  const dict = useDictionary()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [ownedProductIds, setOwnedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [homeError, setHomeError] = useState(false)

  // Modals & Drawers state
  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null)
  const [downloadState, setDownloadState] = useState<{
    isVisible: boolean
    fileName: string
    progress: number
    isComplete: boolean
  }>({
    isVisible: false,
    fileName: '',
    progress: 0,
    isComplete: false,
  })

  const isAr = locale === 'ar'

  useEffect(() => {
    let isMounted = true
    async function loadProducts() {
      try {
        const data = await fetchApi<{ items?: Product[]; products?: Product[] } | Product[]>(`/products?lang=${locale}&limit=6`)
        if (!isMounted) return
        if (Array.isArray(data)) {
          setProducts(data)
        } else if (data && Array.isArray(data.items)) {
          setProducts(data.items)
        } else if (data && Array.isArray(data.products)) {
          setProducts(data.products)
        }
      } catch (err) {
        console.error('Failed to load products for home page:', err)
        if (isMounted) setHomeError(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadProducts()
    return () => {
      isMounted = false
    }
  }, [locale])

  useEffect(() => {
    let ignore = false

    if (!user) {
      setOwnedProductIds([])
      return () => { ignore = true }
    }

    fetchApi<License[]>('/products/my/licenses')
      .then((data) => {
        if (ignore) return
        setOwnedProductIds(
          data.filter((license) => license.isActive && (!license.expiresAt || new Date(license.expiresAt) > new Date()))
            .map((license) => license.productId)
        )
      })
      .catch(() => {
        if (!ignore) setOwnedProductIds([])
      })

    return () => {
      ignore = true
    }
  }, [user])

  const handleDownload = async (productId: string) => {
    const target = products.find((p) => p.id === productId)
    const extension = target?.fileExtension || ''
    const name = target?.name ? (extension && !target.name.toLowerCase().endsWith(extension.toLowerCase()) ? `${target.name}${extension}` : target.name) : 'asset'

    setDownloadState({
      isVisible: true,
      fileName: name,
      progress: 30,
      isComplete: false,
    })

    try {
      setTimeout(() => {
        setDownloadState((prev) => ({ ...prev, progress: 85 }))
      }, 300)

      await downloadProductFile(productId, name)

      setDownloadState({
        isVisible: true,
        fileName: name,
        progress: 100,
        isComplete: true,
      })

      setTimeout(() => {
        setDownloadState((prev) => ({ ...prev, isVisible: false }))
      }, 4000)
    } catch (err) {
      console.error(err)
      setDownloadState((prev) => ({ ...prev, isVisible: false }))
      alert('Download error. Please ensure you have purchased this asset.')
    }
  }

  return (
    <div className="relative overflow-hidden blueprint-grid">
      {/* Ambient Lighting Orbs */}
      <div className="ambient-glow-blue top-[-100px] start-[10%]" />
      <div className="ambient-glow-purple top-[400px] end-[15%]" />
      <div className="center-hairline hidden lg:block" />

      {/* ===== HERO THESIS SECTION ===== */}
      <section className="relative z-10 pt-16 md:pt-28 pb-20 container-custom">
        <div className="max-w-4xl mx-auto text-center mb-12">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line-bright)] text-[11px] font-mono text-[var(--blue-bright)] mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue-bright)] animate-pulse" />
            <span>
              {dict.home.verifiedBanner}
            </span>
          </div>

          {/* Thesis Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[var(--text)] leading-[1.08]">
            {dict.home.theAutomationEngineerS}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--blue-bright)] via-[#a78bfa] to-[var(--green)]">
              {dict.home.workbench}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
            {dict.home.intro}
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/products`}
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
            >
              <span>{dict.home.exploreCatalog}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>

            <Link
              href={`/${locale}/dashboard?tab=upload`}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] border border-[var(--line-bright)] flex items-center gap-2 transition-colors"
            >
              <Code2 className="w-4 h-4 text-[var(--purple)]" />
              <span>{dict.home.sellYourCode}</span>
            </Link>
          </div>
        </div>

        {!loading && products[0] && (
          <div className="max-w-4xl mx-auto deeptools-card rounded-2xl p-6 md:p-8 border border-[var(--line)]">
            <span className="text-xs font-mono text-[var(--blue-bright)] uppercase">
              {dict.home.latestApprovedAsset}
            </span>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">
                  {products[0].displayName || (isAr && products[0].nameAr ? products[0].nameAr : products[0].name)}
                </h2>
                <p className="mt-2 text-sm text-[var(--muted)] line-clamp-3">
                  {products[0].displayDescription || (isAr && products[0].descriptionAr ? products[0].descriptionAr : products[0].description)}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-mono text-[var(--muted-2)]">
                  <span>{products[0].category}</span>
                  {products[0].version && <span>v{products[0].version}</span>}
                  {products[0].fileExtension && <span>{products[0].fileExtension}</span>}
                  {products[0].fileSize != null && <span>{formatBytes(products[0].fileSize)}</span>}
                  {products[0].sellerName && <span>{products[0].sellerName}</span>}
                  <span>{formatDate(products[0].publishedAt || products[0].createdAt, locale)}</span>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                <span className="text-lg font-bold font-mono text-[var(--text)]">{formatCents(products[0].price)}</span>
                <Link href={`/${locale}/products/${products[0].id}`} className="px-4 py-2 rounded-lg bg-[var(--blue)] text-white text-xs font-semibold">
                  {dict.home.viewAsset}
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
      {/* ===== FEATURED WORKBENCH ASSETS ===== */}
      <section className="py-20 container-custom">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--blue-bright)] font-semibold block mb-2">
              {dict.home.approvedEngineeringTools}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
              {dict.home.latestMarketplaceAssets}
            </h2>
          </div>

          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--blue-bright)] hover:underline"
          >
            <span>{dict.home.browseAllAssets}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-xl bg-[var(--surface)] border border-[var(--line)] animate-pulse"
              />
            ))}
          </div>
        ) : homeError ? (
          <p role="alert" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--rose)]">
            {dict.home.couldNotLoadMarketplaceAssets}
          </p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const isOwned =
                ownedProductIds.includes(product.id) ||
                (Boolean(user) && user?.id === product.sellerId)
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  isOwned={isOwned}
                  onBuy={(p) => setSelectedProductForCart(p)}
                  onDownload={(id) => handleDownload(id)}
                />
              )
            })}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-[var(--surface)] border border-[var(--line)] text-center">
            <Terminal className="w-10 h-10 text-[var(--muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--muted)]">
              {dict.home.noPublicEngineeringAssetsUploadedYet}
            </p>
            <Link
              href={`/${locale}/dashboard?tab=upload`}
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-[var(--blue)] text-white text-xs font-semibold"
            >
              {dict.home.beTheFirstToSubmitATool}
            </Link>
          </div>
        )}
      </section>

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={Boolean(selectedProductForCart)}
        product={selectedProductForCart}
        onClose={() => setSelectedProductForCart(null)}
        locale={locale}
        isOwned={
          selectedProductForCart
            ? ownedProductIds.includes(selectedProductForCart.id) ||
              (Boolean(user) && user?.id === selectedProductForCart.sellerId)
            : false
        }
      />

      {/* Floating Download Overlay */}
      <DownloadOverlay
        isVisible={downloadState.isVisible}
        fileName={downloadState.fileName}
        isComplete={downloadState.isComplete}
        onClose={() => setDownloadState((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
}
