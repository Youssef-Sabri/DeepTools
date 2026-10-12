'use client'

import { useState, useEffect } from 'react'
import {
  Terminal,
  Download,
  ShoppingCart,
  ShieldCheck,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  HardDrive,
  User,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import type { Product, License } from '@/lib/types'
import { formatCents, formatBytes, formatDate, getFileExtensionPill } from '@/lib/utils'
import { downloadProductFile, fetchApi } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import { TerminalModal } from '@/components/marketplace/TerminalModal'
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
  const [activeCodeTab, setActiveCodeTab] = useState<'json' | 'python' | 'schema'>('json')
  const [copied, setCopied] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [hasPurchased, setHasPurchased] = useState(false)

  const isCreator = Boolean(user && user.id === product.sellerId)
  const isOwned = isCreator || hasPurchased

  useEffect(() => {
    if (!user || user.id === product.sellerId) { setHasPurchased(false); return }

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
  const filePill = getFileExtensionPill(product.fileKey, product.category)

  const codeSnippets = {
    json: `{\n  "$schema": "https://deeptools.dev/schemas/asset.v1.json",\n  "name": "${product.name}",\n  "category": "${product.category}",\n  "version": "${product.version || '1.0.0'}",\n  "nodes": [\n    {\n      "id": "trigger_event",\n      "type": "webhook",\n      "config": { "method": "POST", "auth": "bearer" }\n    },\n    {\n      "id": "transformer",\n      "type": "deeptools_cents_parser",\n      "config": { "input": "payload.cents" }\n    }\n  ]\n}`,
    python: `from deeptools_sdk import AssetClient\n\nclient = AssetClient(product_id="${product.id}")\nprint(f"Loaded {client.name} v{client.version}")\n\n# Run local test with isolated sandbox\nresponse = client.execute_dry_run({"test": True})\nprint(response.output)`,
    schema: `{\n  "type": "object",\n  "properties": {\n    "id": { "type": "string", "const": "${product.id}" },\n    "name": { "type": "string" },\n    "centsPrice": { "type": "integer", "const": ${product.price} },\n    "status": { "type": "string", "enum": ["APPROVED"] }\n  }\n}`,
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    const fileName = `${product.name}.zip`
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
                <span className="file-pill">
                  {filePill}
                </span>
                <span className="text-xs font-mono text-[var(--muted-2)]">
                  v{product.version || '1.0.0'}
                </span>
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
                    {isAr ? 'الناشر المعتمد' : 'Verified Author'}
                  </span>
                  <span className="text-[var(--text)] font-semibold flex items-center gap-1.5 mt-1">
                    <User className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                    {product.seller?.name || 'DeepTools Engineering'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--muted-2)] uppercase block">
                    {isAr ? 'حجم الملف الرقمي' : 'Asset Size'}
                  </span>
                  <span className="text-[var(--text)] font-semibold flex items-center gap-1.5 mt-1">
                    <HardDrive className="w-3.5 h-3.5 text-[var(--purple)]" />
                    {formatBytes(product.fileSize)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--muted-2)] uppercase block">
                    {isAr ? 'تاريخ النشر' : 'Published Date'}
                  </span>
                  <span className="text-[var(--text)] font-semibold flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--green)]" />
                    {formatDate(product.createdAt, locale)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Terminal Dry-Run Card */}
            <div className="terminal-modal overflow-hidden">
              <div className="terminal-header justify-between">
                <div className="flex items-center">
                  <span className="mac-dot mac-dot-red" />
                  <span className="mac-dot mac-dot-yellow" />
                  <span className="mac-dot mac-dot-green" />
                  <span className="text-xs text-[var(--muted)] font-mono ms-3 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[var(--blue-bright)]" />
                    inspection://{product.name.toLowerCase().replace(/\s+/g, '-')}.spec
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface-2)] border border-[var(--line)] transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-[var(--green)]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => setTerminalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold text-white bg-[var(--blue)] hover:bg-[var(--blue-bright)] transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{isAr ? 'محاكاة التشغيل (Sandbox)' : 'Launch Sandbox'}</span>
                  </button>
                </div>
              </div>

              {/* Code Tabs */}
              <div className="px-4 py-2 bg-[var(--surface)] border-b border-[var(--line)] flex items-center gap-2">
                {(['json', 'python', 'schema'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
                      activeCodeTab === tab
                        ? 'bg-[var(--surface-3)] text-[var(--blue-bright)] border border-[var(--blue)]/40 font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Code viewer */}
              <div className="p-4 bg-[#070b11] font-mono text-xs leading-relaxed overflow-x-auto max-h-[300px]">
                {codeSnippets[activeCodeTab].split('\n').map((line, idx) => (
                  <div key={idx} className="flex hover:bg-[#121927]/60 px-2 py-0.5 rounded">
                    <span className="code-line-number">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-[#d8e2f0] whitespace-pre">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Purchase Widget (1 Column) */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
            <div className="deeptools-card rounded-2xl p-6 md:p-8">
              <div className="mb-6">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--muted-2)] font-semibold block mb-1">
                  {isOwned ? (isAr ? 'الترخيص' : 'LICENSE STATUS') : (isAr ? 'سعر الترخيص' : 'LIFETIME ACCESS')}
                </span>
                <div className="text-3xl font-extrabold font-mono text-[var(--text)]">
                  {isOwned ? (
                    <span className="text-lg text-[var(--green)] flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      {isAr ? 'مرخص لك بالكامل' : 'Purchased & Licensed'}
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
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{isAr ? 'شراء الترخيص فورياً' : 'Buy Asset License'}</span>
                  </button>
                )}

                <button
                  onClick={() => setTerminalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] border border-[var(--line-bright)] flex items-center justify-center gap-2 transition-colors"
                >
                  <Terminal className="w-4 h-4 text-[var(--blue-bright)]" />
                  <span>{isAr ? 'اختبار الأداة في الـ Sandbox' : 'Test in Dry-Run Sandbox'}</span>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-[var(--line)] space-y-3 text-xs text-[var(--muted)]">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[var(--green)] shrink-0" />
                  <span>{isAr ? 'ترخيص تجاري كامل للاستخدام والدمج' : 'Commercial rights for unlimited production pipelines'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--blue-bright)] shrink-0" />
                  <span>{isAr ? 'تنزيل مباشر فوري من السيرفر' : 'Direct authenticated binary stream download'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Sandbox Modal */}
      <TerminalModal
        isOpen={terminalOpen}
        product={product}
        onClose={() => setTerminalOpen(false)}
        locale={locale}
      />

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
