'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  LockKeyhole,
  ShoppingCart,
  X,
} from 'lucide-react'
import Link from 'next/link'
import type { Order, Product } from '@/lib/types'
import { downloadProductFile, fetchApi } from '@/lib/api'
import { formatCents, formatDate } from '@/lib/utils'
import { interpolate } from '@/lib/interpolate'
import { useAuth } from '@/components/providers/AuthProvider'
import { useDictionary } from '@/components/providers/DictionaryProvider'

interface CartDrawerProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  locale: string
  isOwned?: boolean
}

export function CartDrawer({
  product,
  isOpen,
  onClose,
  locale,
  isOwned = false,
}: CartDrawerProps) {
  const dict = useDictionary()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isArabic = locale === 'ar'
  const isCreator = Boolean(user && product && user.id === product.sellerId)

  useEffect(() => {
    if (!completedOrder) return
    const timeout = window.setTimeout(() => {
      onClose()
      router.push(`/${locale}/dashboard?tab=purchases`)
    }, 1400)
    return () => window.clearTimeout(timeout)
  }, [completedOrder, locale, onClose, router])

  useEffect(() => {
    if (!isOpen) {
      setCompletedOrder(null)
      setError(null)
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen || !product) return null

  const displayName = isArabic && product.nameAr ? product.nameAr : product.name

  const handleCheckout = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchApi<{ order: Order }>(
        `/products/${product.id}/purchase`,
        { method: 'POST' },
      )
      setCompletedOrder(result.order)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : dict.cart.checkoutFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const extension = product.fileExtension || ''
      const filename = extension && !product.name.toLowerCase().endsWith(extension.toLowerCase())
        ? `${product.name}${extension}`
        : product.name
      await downloadProductFile(product.id, filename)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : dict.cart.downloadFailed)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-[var(--bg)]/80 backdrop-blur-sm">
        <button
          type="button"
          className="absolute inset-0 h-full w-full cursor-default"
          onClick={onClose}
          aria-label={dict.common.close}
        />
        <div className="fixed inset-y-0 end-0 flex max-w-full">
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            initial={{ x: isArabic ? -460 : 460 }}
            animate={{ x: 0 }}
            exit={{ x: isArabic ? -460 : 460 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="flex w-screen max-w-lg flex-col border-s border-[var(--line-bright)] bg-[var(--surface)] text-[var(--text)] shadow-[0_25px_80px_rgba(2,8,19,0.5)]"
          >
            <header className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--blue)]/30 bg-[var(--blue)]/10 text-[var(--blue-bright)]">
                  {completedOrder ? <CheckCircle2 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                </div>
                <div>
                  <h2 id="checkout-title" className="text-base font-bold sm:text-lg">
                    {completedOrder ? dict.cart.orderPlaced : dict.cart.checkout}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">{displayName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                aria-label={dict.common.close}
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/10 p-3 text-sm text-[var(--rose)]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {completedOrder ? (
                <div className="space-y-5 text-center">
                  <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-6">
                    <Clock3 className="mx-auto mb-3 h-10 w-10 text-amber-300" />
                    <h3 className="text-lg font-bold">{dict.cart.orderPending}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                      {dict.cart.orderPendingDescription}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-start text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-[var(--muted)]">{dict.cart.orderReference}</span>
                      <span className="font-mono">#{completedOrder.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4">
                      <span className="text-[var(--muted)]">{dict.cart.createdAt}</span>
                      <span>{formatDate(completedOrder.createdAt, locale)}</span>
                    </div>
                    <div className="mt-2 flex justify-between gap-4 font-semibold">
                      <span>{dict.cart.total}</span>
                      <span>{formatCents(completedOrder.amount)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/${locale}/dashboard?tab=purchases`}
                    onClick={onClose}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-4 py-3 font-semibold text-white transition-colors hover:bg-[var(--blue-hover)]"
                  >
                    {dict.cart.viewOrders}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </div>
              ) : authLoading ? (
                <div className="flex min-h-56 items-center justify-center" aria-live="polite">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--blue-bright)]" />
                </div>
              ) : !user ? (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--blue)]/30 bg-[var(--blue)]/10 text-[var(--blue-bright)]">
                    <LockKeyhole className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold">{dict.cart.accountRequired}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
                    {dict.cart.signInToPurchase}
                  </p>
                  <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
                    <Link
                      href={`/${locale}/auth/login`}
                      onClick={onClose}
                      className="rounded-xl border border-[var(--line-bright)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-3)]"
                    >
                      {dict.nav.login}
                    </Link>
                    <Link
                      href={`/${locale}/auth/register`}
                      onClick={onClose}
                      className="rounded-xl bg-[var(--blue)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--blue-hover)]"
                    >
                      {dict.nav.register}
                    </Link>
                  </div>
                </div>
              ) : isCreator ? (
                <div className="space-y-4 py-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--blue-bright)]" />
                  <h3 className="text-lg font-bold">{dict.cart.creatorAccess}</h3>
                  <p className="text-sm text-[var(--muted)]">{dict.cart.creatorDownloadNote}</p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-4 py-3 font-semibold text-white transition-colors hover:bg-[var(--blue-hover)] disabled:cursor-wait disabled:opacity-60"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {dict.cart.downloadYourFile}
                  </button>
                </div>
              ) : isOwned ? (
                <div className="space-y-4 py-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                  <h3 className="text-lg font-bold">{dict.cart.toolInYourLibrary}</h3>
                  <p className="text-sm text-[var(--muted)]">{dict.cart.youAlreadyHoldAnActiveCommercialLicenseFor}</p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-4 py-3 font-semibold text-white transition-colors hover:bg-[var(--blue-hover)] disabled:cursor-wait disabled:opacity-60"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {dict.product.downloadDigitalAsset}
                  </button>
                  <Link href={`/${locale}/dashboard?tab=purchases`} onClick={onClose} className="block py-2 text-sm text-[var(--blue-bright)] hover:underline">
                    {dict.cart.goToMyLibrary}
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{product.category}</p>
                        <h3 className="mt-1 font-semibold">{displayName}</h3>
                        {product.fileExtension && <span className="file-pill mt-2 inline-block">{product.fileExtension}</span>}
                      </div>
                      <span className="font-mono text-lg font-bold">{formatCents(product.price)}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] p-4 text-sm leading-relaxed text-[var(--muted)]">
                    {dict.cart.orderWillBePending}
                  </div>
                </div>
              )}
            </div>

            {!completedOrder && user && !isCreator && !isOwned && (
              <footer className="border-t border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue)] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[var(--blue-hover)] disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                  {loading ? dict.cart.processing : interpolate(dict.cart.confirmPurchase, { amount: formatCents(product.price) })}
                </button>
              </footer>
            )}
          </motion.section>
        </div>
      </div>
    </AnimatePresence>
  )
}
