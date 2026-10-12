'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ShoppingCart, Download, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Product, Order } from '@/lib/types'
import { formatCents, getFileExtensionPill } from '@/lib/utils'
import { fetchApi, downloadProductFile } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'

interface CartDrawerProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  locale: string
  isOwned?: boolean
  onOrderCompleted?: (productId: string) => void
}

export function CartDrawer({
  product,
  isOpen,
  onClose,
  locale,
  isOwned = false,
}: CartDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const router = useRouter()
  const isAr = locale === 'ar'

  const isCreator = Boolean(user && product && user.id === product.sellerId)
  const isAlreadyOwned = Boolean(isOwned)

  if (!isOpen || !product) return null

  const handleCheckout = async () => {
    if (!user) {
      router.push(`/${locale}/auth/login`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Backend contract: POST /api/v1/products/:id/purchase
      const result = await fetchApi<{ order: Order }>(
        `/products/${product.id}/purchase`,
        { method: 'POST' }
      )

      const orderObj = result.order || (result as unknown as Order)
      setCompletedOrder(orderObj)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout transaction failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!product) return
    setDownloading(true)
    try {
      await downloadProductFile(product.id, `${product.name}.zip`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed'
      setError(msg)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="fixed inset-y-0 end-0 max-w-full flex">
          <motion.div
            initial={{ x: isAr ? -440 : 440 }}
            animate={{ x: 0 }}
            exit={{ x: isAr ? -440 : 440 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="w-screen max-w-md bg-[var(--surface)] border-s border-[var(--line-bright)] shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[var(--blue-bright)]" />
                <h2 className="text-lg font-bold text-[var(--text)]">
                  {completedOrder
                    ? (isAr ? 'الطلب قيد الدفع' : 'Order Pending')
                    : (isAr ? 'سلة المشتريات والدفع' : 'Secure Checkout')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              {completedOrder ? (
                /* Pending payment view */
                <div className="py-6 flex flex-col items-center text-center">
                  <div className="success-ring flex items-center justify-center mb-6">
                    <Check className="w-8 h-8 text-[var(--green)] stroke-[3]" />
                  </div>

                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--green)] font-semibold mb-1">
                    {isAr ? 'بانتظار تأكيد الدفع' : 'AWAITING PAYMENT VERIFICATION'}
                  </span>
                  <h3 className="text-xl font-bold text-[var(--text)]">
                    {isAr ? 'تم إنشاء طلبك' : 'Order Created'}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 font-mono">
                    {isAr ? 'مرجع الطلب:' : 'Order ID:'} #{completedOrder.id.slice(0, 8).toUpperCase()}
                  </p>

                  <p className="text-xs text-[var(--muted)] mt-6">
                    {isAr ? 'سيصبح التنزيل متاحاً بعد التحقق من الدفع وإصدار الترخيص.' : 'Download becomes available after payment is verified and a license is issued.'}
                  </p>
                </div>
              ) : isCreator ? (
                /* Author / Creator View */
                <div className="py-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--blue)]/15 border border-[var(--blue)]/30 flex items-center justify-center mb-4 text-[var(--blue-bright)]">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--blue-bright)] font-semibold mb-1">
                    {isAr ? 'حساب الناشر المعتمد' : 'VERIFIED AUTHOR ACCESS'}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    {isAr ? 'أنت صاحب هذا الأصل الرقمي' : 'You Published This Tool'}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-2 max-w-xs leading-relaxed">
                    {isAr
                      ? 'بصفتك المطور والناشر، لديك وصول كامل ودائم لملف المصدر دون الحاجة للشراء.'
                      : 'As the verified author, you hold unlimited access to your source archive without repurchase.'}
                  </p>
                  <div className="w-full mt-6">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[var(--green)] hover:bg-[#2bc48d] text-[#080b10] flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>
                        {downloading
                          ? (isAr ? 'جارٍ التحميل...' : 'Downloading...')
                          : (isAr ? 'تحميل حزمة المصدر' : 'Download Source Package')}
                      </span>
                    </button>
                  </div>
                </div>
              ) : isAlreadyOwned ? (
                /* Already Licensed View */
                <div className="py-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--green)]/15 border border-[var(--green)]/30 flex items-center justify-center mb-4 text-[var(--green)]">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--green)] font-semibold mb-1">
                    {isAr ? 'ترخيص إنتاجي نشط' : 'ACTIVE PRODUCTION LICENSE'}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    {isAr ? 'الأصل مضاف إلى مكتبتك' : 'Tool In Your Library'}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-2 max-w-xs leading-relaxed">
                    {isAr
                      ? 'لقد قمت بشراء ترخيص إنتاجي مدى الحياة لهذه الأداة مسبقاً.'
                      : 'You already hold an active commercial license for this digital asset.'}
                  </p>
                  <div className="w-full mt-6">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[var(--green)] hover:bg-[#2bc48d] text-[#080b10] flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>
                        {downloading
                          ? (isAr ? 'جارٍ التحميل...' : 'Downloading...')
                          : (isAr ? 'تحميل الملف الرقمي' : 'Download Asset File')}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Checkout Overview */
                <div className="space-y-6">
                  {error && (
                    <div className="p-3 rounded-lg bg-[var(--rose)]/10 border border-[var(--rose)]/30 text-xs text-[var(--rose)]">
                      {error}
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--blue-bright)] block mb-1">
                          {product.category}
                        </span>
                        <h4 className="font-semibold text-sm text-[var(--text)]">
                          {(isAr && product.nameAr) ? product.nameAr : product.name}
                        </h4>
                        <span className="file-pill mt-2 inline-block">
                          {getFileExtensionPill(product.fileKey, product.category)}
                        </span>
                      </div>
                      <div className="text-right font-mono font-bold text-base text-[var(--text)]">
                        {formatCents(product.price)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>{isAr ? 'سعر الأداة' : 'Subtotal'}</span>
                      <span className="font-mono text-[var(--text)]">{formatCents(product.price)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>{isAr ? 'رسوم الشبكة والمعالجة' : 'Processing Fee'}</span>
                      <span className="font-mono text-[var(--green)]">{isAr ? 'مجاني ($0.00)' : 'Included ($0.00)'}</span>
                    </div>
                    <div className="border-t border-[var(--line)] pt-3 flex justify-between text-sm font-bold text-[var(--text)]">
                      <span>{isAr ? 'المجموع الإجمالي' : 'Total Due'}</span>
                      <span className="font-mono text-[var(--blue-bright)]">{formatCents(product.price)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--surface-3)]/60 border border-[var(--line)] flex items-center gap-2.5 text-xs text-[var(--muted)]">
                    <ShieldCheck className="w-4 h-4 text-[var(--green)] shrink-0" />
                    <span>
                      {isAr
                        ? 'سيصدر الترخيص بعد التحقق من الدفع.'
                        : 'A license is issued after payment verification.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!completedOrder && !isCreator && !isAlreadyOwned && (
              <div className="p-6 border-t border-[var(--line)] bg-[var(--bg-soft)]">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isAr ? 'إنشاء طلب قيد الدفع' : 'Create Pending Order'}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
