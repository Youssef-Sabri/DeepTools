'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Download,
  Key,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Mail,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { fetchApi, downloadProductFile } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useDictionary } from '@/components/providers/DictionaryProvider'

interface GuestPurchaseItem {
  id: string
  productId: string
  productName: string
  productNameAr?: string | null
  category?: string | null
  licenseKey: string
  createdAt: string
  downloadUrl: string
}

interface GuestSessionData {
  email: string
  sessionExpiresAt?: string
  purchases: GuestPurchaseItem[]
}

interface GuestPurchasesContentProps {
  locale: string
}

export default function GuestPurchasesContent({ locale }: GuestPurchasesContentProps) {
  const dict = useDictionary()
  const searchParams = useSearchParams()
  const tokenParam = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<GuestSessionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Lookup state if not logged in
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupSent, setLookupSent] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  // Download states
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const isAr = locale === 'ar'
  const accessLinkInvalid = dict.guest.accessLinkInvalid

  useEffect(() => {
    let ignore = false

    async function initialize() {
      setLoading(true)
      setError(null)

      try {
        if (tokenParam) {
          // 1. Verify single-use magic link token
          const result = await fetchApi<GuestSessionData>(
            `/orders/guest/verify-access?token=${encodeURIComponent(tokenParam)}`
          )
          if (!ignore) {
            setData(result)
            // Clean up the URL query param
            window.history.replaceState(null, '', `/${locale}/guest/purchases`)
          }
        } else {
          // 2. Load active 7-day guest session
          const result = await fetchApi<GuestSessionData>('/orders/guest/purchases')
          if (!ignore) {
            setData(result)
          }
        }
      } catch {
        if (!ignore) {
          setData(null)
          if (tokenParam) {
            setError(accessLinkInvalid)
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    initialize()

    return () => {
      ignore = true
    }
  }, [tokenParam, locale, isAr, accessLinkInvalid])

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleDownload = async (item: GuestPurchaseItem) => {
    setDownloadingId(item.productId)
    try {
      await downloadProductFile(item.productId, item.productName)
    } catch {
      alert(dict.guest.downloadFailedPleaseTryAgain)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleSendLookup = async (e: React.FormEvent) => {
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
  }

  return (
    <div className="relative overflow-hidden blueprint-grid min-h-screen py-10 md:py-16">
      <div className="ambient-glow-blue top-[10%] start-[10%]" />
      <div className="ambient-glow-purple top-[50%] end-[10%]" />

      <div className="container-custom relative z-10 max-w-5xl mx-auto px-4">
        {/* Loading State */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[var(--blue-bright)] animate-spin mb-4" />
            <p className="text-sm font-mono text-[var(--muted)]">
              {dict.guest.verifyingSecurePurchaseSession}
            </p>
          </div>
        )}

        {/* Active Guest Session View */}
        {!loading && data && (
          <div className="space-y-8">
            {/* Header / Session Banner */}
            <div className="deeptools-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-b-[var(--blue)]/40">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/30 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {dict.guest.verifiedAccessLifetimePurchases}
                  </span>
                  <span className="text-xs font-mono text-[var(--muted-2)]">
                    {data.email}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight">
                  {dict.guest.yourDigitalToolLibrary}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5">
                  {dict.guest.permanentNote}
                </p>
              </div>

              {/* Account Upgrade CTA Card */}
              <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line-bright)] max-w-sm shrink-0 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--blue-bright)]">
                  <Sparkles className="w-4 h-4" />
                  <span>{dict.guest.permanentAccountClaim}</span>
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  {dict.guest.registerCta}
                </p>
                <Link
                  href={`/${locale}/auth/register?email=${encodeURIComponent(data.email)}`}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-1.5 transition-colors shadow-md mt-2"
                >
                  <span>{dict.guest.upgradeToFullAccount}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>

            {/* Purchases List */}
            {data.purchases && data.purchases.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-lg font-bold text-[var(--text)] font-mono uppercase tracking-wider">
                    {dict.guest.purchasedAssets} ({data.purchases.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {data.purchases.map((item) => {
                    const displayName = (isAr && item.productNameAr) ? item.productNameAr : item.productName
                    return (
                      <div
                        key={item.id}
                        className="deeptools-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[var(--line-bright)] transition-all"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.category && (
                              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--blue-bright)] border border-[var(--line)]">
                                {item.category}
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-[var(--muted-2)] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.createdAt, locale)}
                            </span>
                          </div>

                          <Link
                            href={`/${locale}/products/${item.productId}`}
                            className="text-lg font-bold text-[var(--text)] hover:text-[var(--blue-bright)] transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>{displayName}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[var(--muted)]" />
                          </Link>

                          {/* License Key Pill */}
                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-[11px] font-mono text-[var(--muted-2)] uppercase">
                              {dict.guest.license}
                            </span>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--surface-2)] border border-[var(--line)]">
                              <Key className="w-3 h-3 text-[var(--blue-bright)]" />
                              <span className="text-xs font-mono font-bold text-[var(--text)] tracking-wider">
                                {item.licenseKey}
                              </span>
                              <button
                                onClick={() => handleCopyKey(item.licenseKey)}
                                className="ms-1.5 text-xs text-[var(--muted)] hover:text-white transition-colors"
                                title={dict.guest.copyKey}
                              >
                                {copiedKey === item.licenseKey ? (
                                  <Check className="w-3.5 h-3.5 text-[var(--green)]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Download Action */}
                        <div className="shrink-0 flex items-center gap-3">
                          <button
                            onClick={() => handleDownload(item)}
                            disabled={downloadingId === item.productId}
                            className="w-full md:w-auto py-3 px-5 rounded-xl font-bold text-xs bg-[var(--green)] hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                          >
                            {downloadingId === item.productId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            <span>
                              {downloadingId === item.productId
                                ? (dict.guest.downloading)
                                : (dict.guest.downloadBinary)}
                            </span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="deeptools-card rounded-2xl p-12 text-center space-y-3">
                <p className="text-sm text-[var(--muted)]">
                  {dict.guest.noActivePurchasesFoundForThisEmail}
                </p>
                <Link
                  href={`/${locale}/products`}
                  className="inline-flex items-center gap-2 text-xs font-mono text-[var(--blue-bright)] hover:underline"
                >
                  <span>{dict.guest.browseMarketplaceCatalog}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Fallback / Lookup Form if not authenticated as guest */}
        {!loading && !data && (
          <div className="max-w-lg mx-auto deeptools-card rounded-2xl p-6 md:p-10 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[var(--blue)]/15 border border-[var(--blue)]/30 flex items-center justify-center mx-auto text-[var(--blue-bright)] mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text)]">
                {dict.guest.lookUpGuestPurchases}
              </h1>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {dict.guest.lookupPitch}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-[var(--rose)]/10 border border-[var(--rose)]/30 text-xs text-[var(--rose)] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {lookupSent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--green)]/15 border border-[var(--green)]/30 text-xs text-[var(--green)] font-semibold flex items-center gap-2.5">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>
                    {dict.guest.linkSentGeneric}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[var(--muted-2)] text-center">
                  {dict.guest.devNote}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendLookup} className="space-y-4">
                {lookupError && (
                  <div className="p-3 rounded-lg bg-[var(--rose)]/10 border border-[var(--rose)]/30 text-xs text-[var(--rose)]">
                    {lookupError}
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-mono text-[var(--muted-2)] block mb-1.5 uppercase tracking-wider">
                    {dict.guest.purchaseEmailAddress}
                  </label>
                  <input
                    type="email"
                    required
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="buyer@example.com"
                    className="w-full px-4 py-3 text-xs rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text)] focus:border-[var(--blue-bright)] focus:outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] disabled:opacity-50"
                >
                  {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  <span>{dict.common.emailMeMyAccessLink}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
