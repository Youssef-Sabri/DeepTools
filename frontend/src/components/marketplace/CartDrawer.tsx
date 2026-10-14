'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Check,
  ShoppingCart,
  Download,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Mail,
  AlertCircle,
  Key,
  Copy,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  RotateCcw,
  CreditCard,
  User as UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { Product, Order } from '@/lib/types'
import { formatCents } from '@/lib/utils'
import { fetchApi, downloadProductFile } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'

interface CartDrawerProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  locale: string
  isOwned?: boolean
  isGuestOwned?: boolean
  onOrderCompleted?: (productId: string) => void
}

interface GuestPurchaseResult {
  order: Order
  license: { id: string; licenseKey: string }
  downloadToken: string
  downloadUrl: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function CartDrawer({
  product,
  isOpen,
  onClose,
  locale,
  isOwned = false,
  isGuestOwned = false,
  onOrderCompleted,
}: CartDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string | null>(null)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [guestLicenseKey, setGuestLicenseKey] = useState<string | null>(null)
  const [guestDownloadToken, setGuestDownloadToken] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  // Guest inputs
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [sendingMagicLink, setSendingMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const { user } = useAuth()
  const isAr = locale === 'ar'

  const isCreator = Boolean(user && product && user.id === product.sellerId)
  const isAlreadyOwned = Boolean(isOwned)

  if (!isOpen || !product) return null

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    setIsDuplicate(false)

    try {
      if (user) {
        setLoadingStep(isAr ? 'جارٍ تسجيل العملية...' : 'Processing license...')
        const result = await fetchApi<{ order: Order }>(
          `/products/${product.id}/purchase`,
          { method: 'POST' }
        )
        const orderObj = result.order || (result as unknown as Order)
        setCompletedOrder(orderObj)
        onOrderCompleted?.(product.id)
      } else {
        if (!isValidEmail(buyerEmail)) {
          setError(
            isAr
              ? 'يرجى إدخال عنوان بريد إلكتروني صالح (مثال: name@domain.com)'
              : 'Please enter a valid email address (e.g. name@domain.com)'
          )
          setLoading(false)
          return
        }

        setLoadingStep(isAr ? 'جارٍ إنشاء الترخيص الرقمي وتأمين الرابط...' : 'Issuing cryptographic license...')
        const result = await fetchApi<GuestPurchaseResult>(
          '/orders/guest-purchase',
          {
            method: 'POST',
            body: JSON.stringify({
              productId: product.id,
              buyerEmail: buyerEmail.trim().toLowerCase(),
              buyerName: buyerName.trim() || undefined,
            }),
          }
        )

        setCompletedOrder(result.order)
        setGuestLicenseKey(result.license.licenseKey)
        setGuestDownloadToken(result.downloadToken)
        onOrderCompleted?.(product.id)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('guest:session_updated'))
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout transaction failed'
      if (msg.includes('already purchased') || msg.includes('Already purchased')) {
        setIsDuplicate(true)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
      setLoadingStep(null)
    }
  }

  const handleSendMagicLink = async () => {
    if (!buyerEmail) return
    setSendingMagicLink(true)
    try {
      await fetchApi('/orders/guest/request-access', {
        method: 'POST',
        body: JSON.stringify({ email: buyerEmail.trim().toLowerCase() }),
      })
      setMagicLinkSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setSendingMagicLink(false)
    }
  }

  const handleDownload = async () => {
    if (!product) return
    setDownloading(true)
    try {
      const extension = product.fileExtension || ''
      const fileName = extension && !product.name.toLowerCase().endsWith(extension.toLowerCase())
        ? `${product.name}${extension}`
        : product.name
      await downloadProductFile(product.id, fileName, guestDownloadToken || undefined)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed'
      setError(msg)
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyKey = () => {
    if (!guestLicenseKey) return
    navigator.clipboard.writeText(guestLicenseKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const emailIsValid = isValidEmail(buyerEmail)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="fixed inset-y-0 end-0 max-w-full flex">
          <motion.div
            initial={{ x: isAr ? -460 : 460 }}
            animate={{ x: 0 }}
            exit={{ x: isAr ? -460 : 460 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-screen max-w-lg bg-[var(--surface)] border-s border-[var(--line)] shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface)] sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--blue)]/10 text-[var(--blue-bright)] border border-[var(--blue)]/20 flex items-center justify-center">
                  {completedOrder ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--green)]" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                    {completedOrder
                      ? (isAr ? 'اكتملت العملية بنجاح' : 'Order Confirmed')
                      : (isAr ? 'الدفع الآمن الفوري' : 'Secure Express Checkout')}
                  </h2>
                  <p className="text-[11px] font-mono text-[var(--muted-2)]">
                    {completedOrder
                      ? (isAr ? 'تم إصدار الترخيص الرقمي' : 'Digital License Activated')
                      : (isAr ? 'تسليم رقمي مشفر فوري' : 'Instant 256-Bit Encrypted Delivery')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-6">
              {completedOrder ? (
                /* Completed Purchase View */
                <div className="space-y-5">
                  {/* Success Hero */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 mb-3 shadow-xs">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 font-bold mb-0.5">
                      {isAr ? 'تم تفعيل الترخيص التجاري' : 'LIFETIME LICENSE ACTIVE'}
                    </span>
                    <h3 className="text-lg font-bold text-[var(--text)]">
                      {isAr ? 'شكراً لاختيارك DeepTools!' : 'Thank you for your purchase!'}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1 font-mono">
                      {isAr ? 'رقم الإيصال:' : 'Receipt:'} #{completedOrder.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Dispatched Notification Card */}
                  <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-[var(--text)] font-semibold">
                      <Mail className="w-4 h-4 text-[var(--blue-bright)] shrink-0" />
                      <span>
                        {isAr ? 'تم إرسال رابط الوصول إلى بريدك' : 'Access Link Dispatched via Email'}
                      </span>
                    </div>
                    <p className="text-[var(--muted)] leading-relaxed text-[11px]">
                      {isAr
                        ? `أرسلنا رابط وصول دائم إلى (${buyerEmail}). تم تفعيل ترخيصك التجاري مدى الحياة، ويمكنك تنزيل الأداة الآن أو في أي وقت عبر رابط بريدك.`
                        : `We sent a lifetime access link to (${buyerEmail}). Your commercial license is active, and you can download your asset now or access it anytime via your email.`}
                    </p>
                  </div>

                  {/* License Key Card */}
                  {guestLicenseKey && (
                    <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line-bright)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[var(--muted-2)] uppercase flex items-center gap-1.5 font-semibold">
                          <Key className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                          {isAr ? 'مفتاح الترخيص الخاص بك' : 'Your Commercial License Key'}
                        </span>
                        <button
                          onClick={handleCopyKey}
                          className="text-xs font-mono text-[var(--blue-bright)] hover:underline flex items-center gap-1 bg-[var(--blue)]/10 px-2 py-0.5 rounded-md"
                        >
                          {copiedKey ? <Check className="w-3 h-3 text-[var(--green)]" /> : <Copy className="w-3 h-3" />}
                          <span className={copiedKey ? 'text-[var(--green)] font-semibold' : ''}>
                            {copiedKey ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
                          </span>
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[var(--surface-3)] font-mono text-sm font-bold text-[var(--text)] tracking-wider break-all select-all text-center border border-[var(--line)]">
                        {guestLicenseKey}
                      </div>
                    </div>
                  )}

                  {/* Action CTAs */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>
                        {downloading
                          ? (isAr ? 'جارٍ البث المباشر للملف...' : 'Streaming from secure storage...')
                          : (isAr ? 'تنزيل الملف الرقمي الآن (.zip)' : 'Download Digital Asset (.zip)')}
                      </span>
                    </button>

                    <Link
                      href={`/${locale}/guest/purchases`}
                      onClick={onClose}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs border border-[var(--line-bright)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] flex items-center justify-center gap-2 transition-colors"
                    >
                      <Key className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                      <span>{isAr ? 'فتح مكتبة مشترياتي الكاملة' : 'Open My Guest Purchases Hub'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--muted-2)] rtl:rotate-90" />
                    </Link>
                  </div>

                  {/* Permanent Account Upgrade */}
                  {!user && (
                    <div className="p-4 rounded-xl border border-[var(--blue-bright)]/30 bg-[var(--blue)]/5 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-[var(--blue-bright)] font-semibold">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>{isAr ? 'حفظ الأداة في حساب دائم' : 'Keep Forever in Cloud Library'}</span>
                      </div>
                      <p className="text-[var(--muted)] text-[11px] leading-relaxed">
                        {isAr
                          ? 'قم بإنشاء حساب مجاني لتثبيت تراخيصك في السحابة والوصول إليها من أي جهاز دون الحاجة لروابط مؤقتة.'
                          : 'Create a permanent password to access this tool forever from any device without needing temporary links.'}
                      </p>
                      <Link
                        href={`/${locale}/auth/register?email=${encodeURIComponent(buyerEmail)}&guest_upgrade=true`}
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--blue-bright)] hover:underline pt-1"
                      >
                        <span>{isAr ? 'إنشاء حساب دائم الآن' : 'Claim permanent account now'}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : isCreator ? (
                /* Creator View */
                <div className="py-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-[var(--blue)]/15 border border-[var(--blue)]/30 flex items-center justify-center mb-4 text-[var(--blue-bright)]">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--blue-bright)] font-semibold mb-1">
                    {isAr ? 'وصول الناشر' : 'CREATOR ACCESS'}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    {isAr ? 'أنت صاحب هذا الأصل الرقمي' : 'You Published This Tool'}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-2 max-w-xs leading-relaxed">
                    {isAr ? 'بصفتك ناشر هذا الأصل، يمكنك تنزيل ملفك في أي وقت.' : "As this asset's creator, you can download the uploaded file."}
                  </p>
                  <div className="w-full mt-6">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[var(--green)] hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>{isAr ? 'تنزيل ملفك' : 'Download Your File'}</span>
                    </button>
                  </div>
                </div>
              ) : isAlreadyOwned ? (
                /* Already Licensed View */
                <div className="py-6 flex flex-col items-center text-center">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                      isGuestOwned
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600'
                        : 'bg-[var(--blue)]/15 border border-[var(--blue)]/30 text-[var(--blue-bright)]'
                    }`}
                  >
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <span
                    className={`text-xs font-mono uppercase tracking-wider font-semibold mb-1 ${
                      isGuestOwned ? 'text-emerald-600' : 'text-[var(--blue-bright)]'
                    }`}
                  >
                    {isGuestOwned
                      ? (isAr ? 'ترخيص دائم مدى الحياة' : 'LIFETIME COMMERCIAL LICENSE')
                      : (isAr ? 'ترخيص دائم في مكتبتك' : 'ACTIVE COMMERCIAL LICENSE')}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    {isGuestOwned
                      ? (isAr ? 'الأداة مملوكة لديك' : 'Asset In Your Purchases')
                      : (isAr ? 'الأداة مضافة إلى مكتبتك' : 'Tool In Your Library')}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-2 max-w-xs leading-relaxed">
                    {isGuestOwned
                      ? (isAr
                          ? 'أنت تمتلك ترخيصاً تجارياً دائماً لهذا الأصل الرقمي. يمكنك تنزيله الآن مباشرة أو استخدام الرابط الدائم المرسل لبريدك الإلكتروني.'
                          : 'You hold a permanent lifetime license for this digital asset. You can download it directly or access it anytime via your email link.')
                      : (isAr
                          ? 'لقد قمت بشراء ترخيص تجاري دائم لهذه الأداة وربطه بحسابك.'
                          : 'You already hold an active commercial license for this digital asset.')}
                  </p>
                  <div className="w-full mt-6 space-y-2">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                        isGuestOwned
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-[var(--blue)] hover:bg-[var(--blue-bright)]'
                      }`}
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>{isAr ? 'تحميل الملف الرقمي' : 'Download Asset File'}</span>
                    </button>
                    <Link
                      href={user ? `/${locale}/dashboard` : `/${locale}/guest/purchases`}
                      onClick={onClose}
                      className="w-full py-2 px-3 rounded-lg text-xs font-mono text-[var(--muted-2)] hover:text-[var(--text)] block text-center"
                    >
                      {user
                        ? (isAr ? 'الانتقال إلى مكتبتي' : 'Go to My Library')
                        : (isAr ? 'عرض كافة مشترياتي' : 'View all my purchases')}
                    </Link>
                  </div>
                </div>
              ) : (
                /* Checkout Form Overview */
                <div className="space-y-5">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                  )}

                  {/* Duplicate Purchase Intercept (409) */}
                  {isDuplicate && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
                      <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{isAr ? 'أنت تمتلك هذا الأصل بالفعل!' : 'You already own this item!'}</span>
                      </div>
                      <p className="text-[var(--muted)] leading-relaxed text-[11px]">
                        {isAr
                          ? `البريد (${buyerEmail}) مسجل لديه ترخيص نشط مسبقاً. تم منع تكرار الدفع. يمكنك طلب رابط وصول فوري أو التبديل لبريد آخر.`
                          : `The email (${buyerEmail}) already holds an active license. We prevented double-billing. You can receive a 1-click access link or use another email.`}
                      </p>

                      <div className="space-y-2 pt-1">
                        {magicLinkSent ? (
                          <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 font-semibold flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span>{isAr ? 'تم إرسال الرابط! راجع بريدك الآن.' : 'Access link sent! Check your inbox.'}</span>
                          </div>
                        ) : (
                          <button
                            onClick={handleSendMagicLink}
                            disabled={sendingMagicLink}
                            className="w-full py-2.5 px-3 rounded-lg font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-2 transition-colors"
                          >
                            {sendingMagicLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                            <span>{isAr ? 'إرسال رابط التحميل إلى بريدي' : 'Email Me My Access Link'}</span>
                          </button>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            href={`/${locale}/guest/purchases`}
                            onClick={onClose}
                            className="flex-1 py-2 px-3 text-center rounded-lg border border-[var(--line-bright)] bg-[var(--surface-2)] text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--surface-3)]"
                          >
                            {isAr ? 'فتح مكتبة مشترياتي' : 'Open Purchases Hub'}
                          </Link>
                          <button
                            onClick={() => {
                              setIsDuplicate(false)
                              setError(null)
                              setBuyerEmail('')
                            }}
                            className="py-2 px-3 rounded-lg text-[11px] font-mono text-[var(--muted-2)] hover:text-[var(--text)] flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>{isAr ? 'بريد آخر' : 'Change email'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product Details Snapshot */}
                  <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--blue-bright)] font-bold">
                            {product.category}
                          </span>
                          {product.version && (
                            <span className="text-[10px] font-mono text-[var(--muted-2)]">v{product.version}</span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[var(--text)] leading-snug">
                          {(isAr && product.nameAr) ? product.nameAr : product.name}
                        </h4>
                        {product.fileExtension && (
                          <span className="file-pill mt-2 inline-block text-[10px] uppercase font-mono">
                            {product.fileExtension}
                          </span>
                        )}
                      </div>
                      <div className="text-right font-mono font-extrabold text-base text-[var(--text)] shrink-0">
                        {formatCents(product.price)}
                      </div>
                    </div>
                  </div>

                  {/* Guest Input Fields (if not logged in) */}
                  {!user && (
                    <div className="space-y-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line-bright)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                          {isAr ? 'بيانات تسليم الترخيص الرقمي' : 'License Delivery & Access'}
                        </span>
                        <Link
                          href={`/${locale}/auth/login`}
                          className="text-[11px] text-[var(--blue-bright)] hover:underline font-medium"
                        >
                          {isAr ? 'تسجيل الدخول' : 'Sign In'}
                        </Link>
                      </div>

                      {/* Email Field with Realtime Validation Feedback */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-mono text-[var(--muted-2)] font-semibold">
                            {isAr ? 'البريد الإلكتروني (إلزامي)' : 'Email Address (Required)'}
                          </label>
                          {buyerEmail && (
                            <span
                              className={`text-[10px] font-mono flex items-center gap-1 ${
                                emailIsValid ? 'text-emerald-600' : 'text-[var(--muted-2)]'
                              }`}
                            >
                              {emailIsValid ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>{isAr ? 'صالح' : 'Valid'}</span>
                                </>
                              ) : (
                                <span>{isAr ? 'أدخل بريداً صحيحاً' : 'Valid email needed'}</span>
                              )}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)]" />
                          <input
                            type="email"
                            required
                            value={buyerEmail}
                            onChange={(e) => {
                              setBuyerEmail(e.target.value)
                              if (isDuplicate) setIsDuplicate(false)
                              if (error) setError(null)
                            }}
                            placeholder="your.email@company.com"
                            className={`w-full ps-9 pe-3 py-2 text-xs rounded-lg bg-[var(--bg-soft)] border text-[var(--text)] focus:outline-none font-mono transition-colors ${
                              emailIsValid
                                ? 'border-emerald-500/50 focus:border-emerald-500'
                                : 'border-[var(--line)] focus:border-[var(--blue-bright)]'
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--muted-2)] mt-1 font-mono">
                          {isAr
                            ? 'يتم إرسال مفتاح الترخيص المشفر ورابط التنزيل المباشر لهذا البريد.'
                            : "We'll send your cryptographic license key & download stream here."}
                        </p>
                      </div>

                      {/* Optional Name */}
                      <div>
                        <label className="text-[11px] font-mono text-[var(--muted-2)] block mb-1 font-semibold">
                          {isAr ? 'اسم المهندس / المستلم (اختياري)' : 'Engineer / Buyer Name (Optional)'}
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)]" />
                          <input
                            type="text"
                            value={buyerName}
                            onChange={(e) => setBuyerName(e.target.value)}
                            placeholder={isAr ? 'يوسف وائل' : 'Alex Vance'}
                            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--text)] focus:border-[var(--blue-bright)] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Simulator Info */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-[var(--blue)]/5 via-[var(--surface-2)] to-transparent border border-[var(--line)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                        <span>{isAr ? 'بوابة الدفع التجريبي الفوري' : 'Instant Sandbox Fulfillment'}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {isAr ? 'موافقة فورية 100%' : 'Pre-Approved'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                      {isAr
                        ? 'عملية شراء تجريبية بدون خصم مالي حقيقي. يصدر الترخيص الإنتاجي المشفر ورابط التنزيل السحابي في أجزاء من الثانية.'
                        : 'Sandbox transaction with zero friction. Commercial license and verified binary stream are issued in under 50ms.'}
                    </p>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>{isAr ? 'سعر الأداة' : 'Digital Tool Subtotal'}</span>
                      <span className="font-mono text-[var(--text)]">{formatCents(product.price)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--muted)]">
                      <span>{isAr ? 'رسوم المعاملة' : 'Processing Fee'}</span>
                      <span className="font-mono text-emerald-600 font-semibold">{isAr ? 'مجاني ($0.00)' : 'Free ($0.00)'}</span>
                    </div>
                    <div className="border-t border-[var(--line)] pt-2.5 flex justify-between text-sm font-bold text-[var(--text)]">
                      <span>{isAr ? 'المجموع المستحق' : 'Total Due'}</span>
                      <span className="font-mono text-[var(--blue-bright)] text-base">
                        {formatCents(product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Checkout CTA Footer */}
            {!completedOrder && !isCreator && !isAlreadyOwned && !isDuplicate && (
              <div className="p-5 sm:p-6 border-t border-[var(--line)] bg-[var(--surface)] shadow-lg space-y-2">
                <button
                  onClick={handleCheckout}
                  disabled={loading || (!user && !emailIsValid)}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{loadingStep || (isAr ? 'جارٍ المعالجة...' : 'Processing...')}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        {user
                          ? (isAr ? `تأكيد الشراء (${formatCents(product.price)})` : `Confirm Purchase (${formatCents(product.price)})`)
                          : (isAr ? `إتمام الطلب الفوري (${formatCents(product.price)})` : `Complete Guest Order (${formatCents(product.price)})`)}
                      </span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>

                {!user && (
                  <p className="text-[10px] text-center font-mono text-[var(--muted-2)]">
                    {isAr
                      ? 'دفع لمرة واحدة • بدون اشتراك شهري • تفعيل فوري'
                      : 'One-time payment • No subscription • Instant verified delivery'}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}
