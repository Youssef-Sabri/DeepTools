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
  Mail,
  X,
  Loader2,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import type { Product, License } from '@/lib/types'
import { formatCents, formatBytes, formatDate } from '@/lib/utils'
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
  const [isGuestOwned, setIsGuestOwned] = useState(false)

  const isCreator = Boolean(user && user.id === product.sellerId)
  const isOwned = isCreator || hasPurchased

  useEffect(() => {
    let ignore = false

    const checkProductOwnership = () => {
      if (user) {
        if (user.id === product.sellerId) return
        fetchApi<License[]>('/products/my/licenses')
          .then((data) => {
            if (ignore) return
            setIsGuestOwned(false)
            setHasPurchased(
              data.some(
                (license) =>
                  license.productId === product.id &&
                  license.isActive &&
                  (!license.expiresAt || new Date(license.expiresAt) > new Date())
              )
            )
          })
          .catch(() => {})
      } else {
        // Check if current guest session owns this product
        fetchApi<{ email: string; purchases: Array<{ productId: string }> }>(
          '/orders/guest/purchases'
        )
          .then((data) => {
            if (ignore) return
            const owned = data.purchases?.some((p) => p.productId === product.id) ?? false
            setHasPurchased(owned)
            setIsGuestOwned(owned)
          })
          .catch(() => {
            if (ignore) return
            setHasPurchased(false)
            setIsGuestOwned(false)
          })
      }
    }

    checkProductOwnership()

    const handleSessionUpdate = () => {
      checkProductOwnership()
    }
    window.addEventListener('guest:session_updated', handleSessionUpdate)

    return () => {
      ignore = true
      window.removeEventListener('guest:session_updated', handleSessionUpdate)
    }
  }, [user, product.id, product.sellerId])

  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupSent, setLookupSent] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
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
  const filePill = product.fileExtension
  const sellerName = product.sellerName?.trim() || (dict.common.sellerUnavailable)
  const assetSize = product.fileSize == null ? (dict.product.sizeUnavailable) : formatBytes(product.fileSize)
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
            <span>{dict.product.backToMarketplace}</span>
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
                    {dict.product.seller}
                  </span>
                  <span className="text-[var(--text)] font-semibold flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                    {sellerName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--muted-2)] uppercase block">
                    {dict.product.assetSize}
                  </span>
                  <span className="text-[var(--text)] font-semibold flex items-center gap-1.5 mt-1">
                    <HardDrive className="w-3.5 h-3.5 text-[var(--purple)]" />
                    {assetSize}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--muted-2)] uppercase block">
                    {dict.product.publishedDate}
                  </span>
                  <span className="text-[var(--text)] font-semibold flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--green)]" />
                    {product.publishedAt ? formatDate(product.publishedAt, locale) : (dict.product.publicationDateUnavailable)}
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
                  {isOwned ? (dict.product.access) : (dict.product.assetPrice)}
                </span>
                <div className="text-3xl font-extrabold font-mono text-[var(--text)]">
                  {isOwned ? (
                    <span
                      className={`text-lg flex items-center gap-2 font-semibold ${
                        isGuestOwned ? 'text-emerald-600' : 'text-[var(--blue-bright)]'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      {isCreator
                        ? (dict.product.yourAssetCreator)
                        : isGuestOwned
                          ? (dict.product.ownedLifetime)
                          : (dict.product.ownedInLibrary)}
                    </span>
                  ) : (
                    formatCents(product.price)
                  )}
                </div>
                <span className="text-[11px] text-[var(--muted-2)] font-mono block mt-1">
                  {isOwned
                    ? (isGuestOwned
                        ? (dict.product.guestLicenseNote)
                        : (dict.product.accountLicenseNote))
                    : (dict.product.singlePaymentNoRecurringCharges)}
                </span>
              </div>

              <div className="space-y-3">
                {isOwned ? (
                  <button
                    onClick={handleDownload}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                      isGuestOwned
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[var(--blue)] hover:bg-[var(--blue-bright)]'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{dict.product.downloadDigitalAsset}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCartOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{dict.product.buyAssetLicense}</span>
                  </button>
                )}
                {!isOwned && !user && (
                  <button
                    type="button"
                    onClick={() => {
                      setLookupOpen(true)
                      setLookupSent(false)
                      setLookupError(null)
                    }}
                    className="text-xs text-[var(--muted-2)] hover:text-[var(--blue-bright)] transition-colors underline font-mono text-center w-full block pt-1.5"
                  >
                    {dict.product.alreadyBoughtAsGuestUnlockDownload}
                  </button>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--line)] space-y-3 text-xs text-[var(--muted)]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--blue-bright)] shrink-0" />
                  <span>{dict.product.streamNote}</span>
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
        isGuestOwned={isGuestOwned}
        onOrderCompleted={() => {
          setHasPurchased(true)
          if (!user) {
            setIsGuestOwned(true)
          }
        }}
      />

      {/* Floating Download Overlay */}
      <DownloadOverlay
        isVisible={downloadState.isVisible}
        fileName={downloadState.fileName}
        isComplete={downloadState.isComplete}
        onClose={() => setDownloadState((prev) => ({ ...prev, isVisible: false }))}
      />

      {/* Guest Purchases Unlock Modal */}
      {lookupOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--line-bright)] rounded-2xl p-6 md:p-8 shadow-2xl">
            <button
              onClick={() => setLookupOpen(false)}
              className="absolute top-5 end-5 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-[var(--blue-bright)]" />
              <h3 className="text-lg font-bold text-[var(--text)]">
                {dict.product.unlockGuestPurchases}
              </h3>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-6">
              {dict.product.lookupEmailHint}
            </p>

            {lookupSent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--green)]/15 border border-[var(--green)]/30 text-xs text-[var(--green)] font-semibold flex items-center gap-2.5">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>
                    {dict.product.linkSentNote}
                  </span>
                </div>
                <button
                  onClick={() => setLookupOpen(false)}
                  className="w-full py-3 rounded-xl font-bold text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] transition-colors"
                >
                  {dict.common.close}
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!lookupEmail) return
                  setLookupLoading(true)
                  setLookupError(null)
                  try {
                    await fetchApi('/orders/guest/request-access', {
                      method: 'POST',
                      body: JSON.stringify({ email: lookupEmail.trim().toLowerCase() }),
                    })
                    setLookupSent(true)
                  } catch (err: unknown) {
                    setLookupError(err instanceof Error ? err.message : 'Request failed')
                  } finally {
                    setLookupLoading(false)
                  }
                }}
                className="space-y-4"
              >
                {lookupError && (
                  <div className="p-3 rounded-lg bg-[var(--rose)]/10 border border-[var(--rose)]/30 text-xs text-[var(--rose)]">
                    {lookupError}
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-mono text-[var(--muted-2)] block mb-1">
                    {dict.common.emailAddress}
                  </label>
                  <input
                    type="email"
                    required
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="buyer@example.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] focus:border-[var(--blue-bright)] focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                >
                  {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span>{dict.product.sendInstantAccessLink}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
