'use client'

import { useState, useEffect } from 'react'
import {
  Download,
  ShoppingCart,
  CheckCircle2,
  User,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import type { Product, License } from '@/lib/types'
import { formatCents, formatBytes, formatDate, getFileExtensionPill } from '@/lib/utils'
import { downloadProductFile, fetchApi } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import { CartDrawer } from '@/components/marketplace/CartDrawer'
import { DownloadOverlay } from '@/components/marketplace/DownloadOverlay'
import { useDictionary } from '@/components/providers/DictionaryProvider'

interface ProductDetailContentProps {
  product: Product
  locale: string
}

export default function ProductDetailContent({
  product,
  locale,
}: ProductDetailContentProps) {
  const dict = useDictionary()
  const { user } = useAuth()
  const [cartOpen, setCartOpen] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)

  const isCreator = Boolean(user && user.id === product.sellerId)
  const isOwned = isCreator || (Boolean(user) && hasPurchased)

  useEffect(() => {
    if (!user || user.id === product.sellerId) return
    let ignore = false

    fetchApi<License[]>('/products/my/licenses')
      .then((data) => {
        if (ignore) return
        setHasPurchased(
          data.some(
            (license) =>
              license.productId === product.id &&
              license.isActive &&
              (!license.expiresAt || new Date(license.expiresAt) > new Date())
          )
        )
      })
      .catch(() => {
        if (!ignore) setHasPurchased(false)
      })

    return () => {
      ignore = true
    }
  }, [user, product.id, product.sellerId])

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

  const displayName = product.displayName || ((isAr && product.nameAr) ? product.nameAr : product.name)
  const displayDescription = product.displayDescription || ((isAr && product.descriptionAr) ? product.descriptionAr : product.description)
  const filePill = product.fileExtension || (product.fileKey ? getFileExtensionPill(product.fileKey) : null)
  const sellerName = product.sellerName?.trim() || product.seller?.name?.trim() || dict.common.sellerUnavailable
  const badge = (product.displayBadge || (isAr && product.badgeAr ? product.badgeAr : product.badge))?.trim()

  const handleDownload = async () => {
    const extension = product.fileExtension || ''
    const fileName = extension && !product.name.toLowerCase().endsWith(extension.toLowerCase())
      ? `${product.name}${extension}`
      : product.name
    setDownloadState({
      isVisible: true,
      fileName,
      progress: 30,
      isComplete: false,
    })

    try {
      setTimeout(() => {
        setDownloadState((prev) => ({ ...prev, progress: 85 }))
      }, 300)

      await downloadProductFile(product.id, fileName)

      setDownloadState({
        isVisible: true,
        fileName,
        progress: 100,
        isComplete: true,
      })

      setTimeout(() => {
        setDownloadState((prev) => ({ ...prev, isVisible: false }))
      }, 4000)
    } catch {
      setDownloadState((prev) => ({ ...prev, isVisible: false }))
      alert(dict.product.downloadFailed)
    }
  }

  return (
    <div className="marketplace-page relative overflow-hidden blueprint-grid min-h-screen py-12 md:py-20">
      {/* Ambient glows */}
      <div className="ambient-glow-blue top-[5%] start-[10%]" />
      <div className="ambient-glow-purple top-[40%] end-[10%]" />

      <div className="container-custom relative z-10">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href={`/${locale}/products`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{dict.product.backToMarketplace}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(310px,360px)]">
          <div className="space-y-6">
            <section className="premium-panel p-6 md:p-9" aria-labelledby="product-title">
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--line-bright)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--blue-bright)]">{product.category}</span>
                {badge && <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-medium text-[var(--text)]">{badge}</span>}
              </div>
              <h1 id="product-title" className="text-3xl font-extrabold leading-tight text-[var(--text)] sm:text-4xl">{displayName}</h1>
              <h2 className="mt-9 text-base font-semibold text-[var(--text)]">{dict.product.overview}</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-8 text-[var(--muted)]">{displayDescription}</p>
            </section>

            <section className="premium-panel p-6 md:p-8" aria-labelledby="seller-heading">
              <h2 id="seller-heading" className="text-lg font-semibold text-[var(--text)]">{dict.product.seller}</h2>
              <div className="mt-5 flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line-bright)] bg-[var(--surface-2)] text-[var(--blue-bright)]" aria-hidden="true"><User className="h-5 w-5" /></span>
                <span className="text-base font-medium text-[var(--text)]">{sellerName}</span>
              </div>
            </section>

            <section className="premium-panel p-6 md:p-8" aria-labelledby="facts-heading">
              <h2 id="facts-heading" className="text-lg font-semibold text-[var(--text)]">{dict.product.technicalFacts}</h2>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
                <div><dt className="text-sm text-[var(--muted-2)]">{dict.product.category}</dt><dd className="mt-1 text-sm font-semibold text-[var(--text)]">{product.category}</dd></div>
                {filePill && <div><dt className="text-sm text-[var(--muted-2)]">{dict.product.fileType}</dt><dd className="mt-1 font-mono text-sm font-semibold text-[var(--text)]">{filePill}</dd></div>}
                {product.version && <div><dt className="text-sm text-[var(--muted-2)]">{dict.product.version}</dt><dd className="mt-1 font-mono text-sm font-semibold text-[var(--text)]">{product.version}</dd></div>}
                {product.fileSize != null && <div><dt className="text-sm text-[var(--muted-2)]">{dict.product.assetSize}</dt><dd className="mt-1 font-mono text-sm font-semibold text-[var(--text)]">{formatBytes(product.fileSize)}</dd></div>}
                <div><dt className="text-sm text-[var(--muted-2)]">{dict.product.createdDate}</dt><dd className="mt-1 text-sm font-semibold text-[var(--text)]">{formatDate(product.createdAt, locale)}</dd></div>
                {product.publishedAt && <div><dt className="text-sm text-[var(--muted-2)]">{dict.product.publishedDate}</dt><dd className="mt-1 text-sm font-semibold text-[var(--text)]">{formatDate(product.publishedAt, locale)}</dd></div>}
              </dl>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28" aria-label={dict.product.purchasePanel}>
            <div className="premium-panel border-[var(--line-bright)] p-6 md:p-8">
              <span className="text-sm text-[var(--muted-2)]">{dict.product.assetPrice}</span>
              <p className="mt-2 font-mono text-4xl font-bold tracking-tight text-[var(--text)]">{formatCents(product.price)}</p>
              {isOwned && <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--green)]"><CheckCircle2 className="h-4 w-4" />{isCreator ? dict.product.yourAssetCreator : dict.product.ownedInLibrary}</p>}
              {isOwned ? (
                <button type="button" onClick={handleDownload} className="premium-button mt-7 flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--blue)] px-4 text-sm font-bold text-white hover:bg-[var(--blue-hover)]"><Download className="h-4 w-4" />{dict.product.downloadDigitalAsset}</button>
              ) : (
                <button type="button" onClick={() => setCartOpen(true)} className="premium-button mt-7 flex min-h-12 w-full items-center justify-center gap-2 bg-[var(--blue)] px-4 text-sm font-bold text-white hover:bg-[var(--blue-hover)]"><ShoppingCart className="h-4 w-4" />{dict.product.buyAssetLicense}</button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        product={product}
        onClose={() => setCartOpen(false)}
        locale={locale}
        isOwned={isOwned}
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
