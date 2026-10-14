'use client'

import { useState, useEffect } from 'react'
import {
  Download,
  ShoppingCart,
  CheckCircle2,
  Clock,
  HardDrive,
  User,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import type { Product, License } from '@/lib/types'
import { formatCents, formatBytes, formatDate } from '@/lib/utils'
import { downloadProductFile, fetchApi } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import { CartDrawer } from '@/components/marketplace/CartDrawer'
import { DownloadOverlay } from '@/components/marketplace/DownloadOverlay'
import type { Dictionary } from '@/dictionaries'

interface ProductDetailContentProps {
  product: Product
  locale: string
  dict?: Dictionary
}

export default function ProductDetailContent({
  product,
  locale,
}: ProductDetailContentProps) {
  const { user } = useAuth()
  const [cartOpen, setCartOpen] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)

  const isCreator = Boolean(user && user.id === product.sellerId)
  const isOwned = isCreator || hasPurchased

  useEffect(() => {
    if (!user || user.id === product.sellerId) return

    let ignore = false
    fetchApi<License[]>('/products/my/licenses')
      .then((data) => {
        if (ignore) return
        setHasPurchased(data.some((license) => license.productId === product.id && license.isActive && (!license.expiresAt || new Date(license.expiresAt) > new Date())))
      })
      .catch(() => {})

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

  const displayName = (isAr && product.nameAr) ? product.nameAr : product.name
  const displayDescription = (isAr && product.descriptionAr) ? product.descriptionAr : product.description
  const filePill = product.fileExtension
  const sellerName = product.sellerName?.trim() || (isAr ? 'اسم الناشر غير متاح' : 'Seller unavailable')
  const assetSize = product.fileSize == null ? (isAr ? 'حجم الملف غير متاح' : 'Size unavailable') : formatBytes(product.fileSize)
  const badge = (isAr && product.badgeAr ? product.badgeAr : product.badge)?.trim()

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
      alert(isAr ? 'فشل التنزيل. تأكد من أنك تمتلك هذا الأصل الرقمي.' : 'Download failed. Ensure you have purchased this asset.')
    }
  }

  return (
    <div className="relative overflow-hidden blueprint-grid min-h-screen py-10 md:py-16">
      {/* Ambient glows */}
      <div className="ambient-glow-blue top-[5%] start-[10%]" />
      <div className="ambient-glow-purple top-[40%] end-[10%]" />

      <div className="container-custom relative z-10">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center gap-2 text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{isAr ? 'العودة إلى الكتالوج' : 'Back to Marketplace'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content (2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Card */}
            <div className="deeptools-card rounded-2xl overflow-hidden p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-md bg-[var(--surface-2)] text-[var(--blue-bright)] border border-[var(--line-bright)]">
                  {product.category}
                </span>
                {product.fileExtension && <span className="file-pill">{filePill}</span>}
                {product.version && <span className="text-xs font-mono text-[var(--muted-2)]">v{product.version}</span>}
                {badge && <span className="text-xs font-mono text-[var(--green)]">{badge}</span>}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
                {displayName}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-[var(--muted)] leading-relaxed whitespace-pre-line">
                {displayDescription}
              </p>

              {/* Author and Technical Specs */}
              <div className="mt-8 pt-6 border-t border-[var(--line)] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[var(--muted-2)] uppercase block">
                    {isAr ? 'الناشر' : 'Seller'}
                  </span>
                  <span className="text-[var(--text)] font-semibold flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                    {sellerName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--muted-2)] uppercase block">
                    {isAr ? 'حجم الملف الرقمي' : 'Asset Size'}
                  </span>
                  <span className="text-[var(--text)] font-semibold flex items-center gap-1.5 mt-1">
                    <HardDrive className="w-3.5 h-3.5 text-[var(--purple)]" />
                    {assetSize}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--muted-2)] uppercase block">
                    {isAr ? 'تاريخ النشر' : 'Published Date'}
                  </span>
                  <span className="text-[var(--text)] font-semibold flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--green)]" />
                    {product.publishedAt ? formatDate(product.publishedAt, locale) : (isAr ? 'تاريخ النشر غير متاح' : 'Publication date unavailable')}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Purchase Widget (1 Column) */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
            <div className="deeptools-card rounded-2xl p-6 md:p-8">
              <div className="mb-6">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted-2)] font-semibold block mb-1">
                  {isOwned ? (isAr ? 'الوصول' : 'ACCESS') : (isAr ? 'سعر الأصل' : 'ASSET PRICE')}
                </span>
                <div className="text-3xl font-extrabold font-mono text-[var(--text)]">
                  {isOwned ? (
                    <span className="text-lg text-[var(--green)] flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      {isCreator ? (isAr ? 'أصلك الرقمي' : 'Your Asset') : (isAr ? 'ترخيص نشط' : 'Licensed')}
                    </span>
                  ) : (
                    formatCents(product.price)
                  )}
                </div>
                <span className="text-[11px] text-[var(--muted-2)] font-mono block mt-1">
                  {isAr ? 'دفع لمرة واحدة • بدون اشتراك' : 'Single payment • No recurring charges'}
                </span>
              </div>

              <div className="space-y-3">
                {isOwned ? (
                  <button
                    onClick={handleDownload}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[var(--green)] hover:bg-[#2bc48d] text-[#080b10] flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تحميل الأداة الآن' : 'Download Digital Asset'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCartOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isAr ? 'شراء ترخيص الأصل' : 'Buy Asset License'}</span>
                  </button>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--line)] space-y-3 text-xs text-[var(--muted)]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--blue-bright)] shrink-0" />
                  <span>{isAr ? 'تنزيل مباشر فوري من السيرفر' : 'Direct authenticated binary stream download'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        product={product}
        onClose={() => setCartOpen(false)}
        locale={locale}
        isOwned={isOwned}
        onOrderCompleted={() => {
          setHasPurchased(true)
        }}
      />

      {/* Floating Download Overlay */}
      <DownloadOverlay
        isVisible={downloadState.isVisible}
        fileName={downloadState.fileName}
        progress={downloadState.progress}
        isComplete={downloadState.isComplete}
        onClose={() => setDownloadState((prev) => ({ ...prev, isVisible: false }))}
        locale={locale}
      />
    </div>
  )
}
