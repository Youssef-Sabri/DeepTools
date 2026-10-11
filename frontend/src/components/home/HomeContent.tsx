'use client'

import { useState, useEffect } from 'react'
import {
  Terminal,
  ArrowRight,
  Play,
  Check,
  Copy,
  Code2,
} from 'lucide-react'
import Link from 'next/link'
import type { Product, Order } from '@/lib/types'
import { fetchApi, downloadProductFile } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { TerminalModal } from '@/components/marketplace/TerminalModal'
import { CartDrawer } from '@/components/marketplace/CartDrawer'
import { DownloadOverlay } from '@/components/marketplace/DownloadOverlay'
import type { Dictionary } from '@/dictionaries'

interface HomeContentProps {
  dict?: Dictionary
  locale: string
}

export default function HomeContent({ locale }: HomeContentProps) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [ownedProductIds, setOwnedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeHeroTab, setActiveHeroTab] = useState<'n8n' | 'agent' | 'script'>('n8n')
  const [heroCopied, setHeroCopied] = useState(false)
  const [heroExecuting, setHeroExecuting] = useState(false)
  const [heroLogs, setHeroLogs] = useState<string[]>([
    '[INIT] DeepTools v2.4 runtime ready.',
    '[INFO] Select a workflow tab and trigger execution test.',
  ])

  // Modals & Drawers state
  const [selectedProductForTerminal, setSelectedProductForTerminal] = useState<Product | null>(null)
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
    if (!user) return
    let ignore = false
    fetchApi<{ orders?: Order[] } | Order[]>('/orders/mine')
      .then((data) => {
        if (ignore) return
        const orders = Array.isArray(data) ? data : data?.orders || []
        setOwnedProductIds(
          orders
            .map((o) => o.productId || o.product?.id)
            .filter((id): id is string => Boolean(id))
        )
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [user])

  const heroSnippets = {
    n8n: `{\n  "name": "Stripe-to-Postgres Event Ingestor",\n  "nodes": [\n    { "type": "n8n-nodes-base.stripeTrigger", "event": "charge.succeeded" },\n    { "type": "deeptools.centsToDollarsTransformer", "input": "amount" },\n    { "type": "n8n-nodes-base.postgres", "operation": "upsertOrder" }\n  ]\n}`,
    agent: `import { AgenticWorker } from "deeptools-agents";\n\nconst agent = new AgenticWorker({\n  model: "gemini-2.5-pro",\n  memory: "redis://127.0.0.1:6379",\n  skills: ["schema_inspection", "database_tuning"]\n});\n\nawait agent.listenToQueue("db.optimization.events");`,
    script: `#!/usr/bin/env python3\nimport sys, httpx\n\ndef audit_pipeline():\n    print("[+] Scanning webhook endpoints for latency...")\n    resp = httpx.get("http://localhost:4000/api/v1/health")\n    assert resp.status_code == 200\n    print("[+] Latency 14ms // Health OK")\n\nif __name__ == "__main__":\n    audit_pipeline()`,
  }

  const handleCopyHero = () => {
    navigator.clipboard.writeText(heroSnippets[activeHeroTab])
    setHeroCopied(true)
    setTimeout(() => setHeroCopied(false), 2000)
  }

  const handleHeroRun = () => {
    setHeroExecuting(true)
    setHeroLogs(['[RUN] Spawning isolated sandboxed thread container...'])
    setTimeout(() => {
      setHeroLogs((prev) => [...prev, `[LOAD] Ingested node definition: ${activeHeroTab.toUpperCase()}`])
    }, 350)
    setTimeout(() => {
      setHeroLogs((prev) => [
        ...prev,
        '[TEST] Executed simulated payload against schema validator.',
        '[OK] Dry-run passed: Exit code 0, 0 runtime faults.',
      ])
      setHeroExecuting(false)
    }, 900)
  }

  const handleDownload = async (productId: string) => {
    const target = products.find((p) => p.id === productId)
    const name = `${target?.name || 'asset'}.zip`

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
              {isAr
                ? 'أدوات برمجية موثوقة // سيناريوهات • نصوص • وكلاء ذكاء اصطناعي'
                : 'VERIFIED PRODUCTION ASSETS // WORKFLOWS • SCRIPTS • AGENTS'}
            </span>
          </div>

          {/* Thesis Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[var(--text)] leading-[1.08]">
            {isAr ? 'منصة مهندسي الأتمتة' : 'The Automation Engineer’s'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--blue-bright)] via-[#a78bfa] to-[var(--green)]">
              {isAr ? 'المتكاملة.' : 'Workbench.'}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'سوق متقدم للمطورين لاكتشاف واختبار وشراء أصول الأتمتة الجاهزة للإنتاج. كود أصلي، مفاتيح ترخيص فورية، ومحاكاة تشغيل مسبقة.'
              : 'Discover, simulate in dry-run sandboxes, and instantly deploy production workflows, scripts, and autonomous AI agent skills.'}
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/products`}
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
            >
              <span>{isAr ? 'استكشف كتالوج الأدوات' : 'Explore Catalog'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>

            <Link
              href={`/${locale}/dashboard?tab=upload`}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] border border-[var(--line-bright)] flex items-center gap-2 transition-colors"
            >
              <Code2 className="w-4 h-4 text-[var(--purple)]" />
              <span>{isAr ? 'انشر أداتك وابدأ البيع' : 'Sell Your Code'}</span>
            </Link>
          </div>
        </div>

        {/* ===== HERO SIGNATURE: LIVE WORKBENCH TERMINAL ===== */}
        <div className="max-w-4xl mx-auto terminal-modal overflow-hidden">
          {/* macOS Header */}
          <div className="terminal-header justify-between">
            <div className="flex items-center">
              <span className="mac-dot mac-dot-red" />
              <span className="mac-dot mac-dot-yellow" />
              <span className="mac-dot mac-dot-green" />
              <span className="text-xs text-[var(--muted)] font-mono ms-3">
                sandbox://deeptools-runtime.local:8080
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHero}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface-2)] border border-[var(--line)] transition-colors"
              >
                {heroCopied ? <Check className="w-3 h-3 text-[var(--green)]" /> : <Copy className="w-3 h-3" />}
                <span>{heroCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleHeroRun}
                disabled={heroExecuting}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono font-semibold text-white bg-[var(--blue)] hover:bg-[var(--blue-bright)] disabled:opacity-50 transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{heroExecuting ? 'Executing...' : 'Run Dry Test'}</span>
              </button>
            </div>
          </div>

          {/* Subheader Tabs */}
          <div className="px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--line)] flex items-center gap-2">
            {[
              { id: 'n8n', label: 'workflow.json (n8n)' },
              { id: 'agent', label: 'agent_runner.ts' },
              { id: 'script', label: 'audit_tool.py' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveHeroTab(tab.id as 'n8n' | 'agent' | 'script')}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                  activeHeroTab === tab.id
                    ? 'bg-[var(--surface-3)] text-[var(--blue-bright)] border border-[var(--blue)]/40 font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="p-4 bg-[#070b11] font-mono text-xs leading-relaxed overflow-x-auto max-h-[220px]">
            {heroSnippets[activeHeroTab].split('\n').map((line, idx) => (
              <div key={idx} className="flex">
                <span className="code-line-number">{String(idx + 1).padStart(2, '0')}</span>
                <span className="text-[#d8e2f0] whitespace-pre">{line}</span>
              </div>
            ))}
          </div>

          {/* Live Telemetry Bar */}
          <div className="p-3 bg-[#05070a] border-t border-[var(--line)] font-mono text-[11px]">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted-2)] mb-1 font-semibold">
              SANDBOX STATUS LOGS
            </div>
            {heroLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('[OK]')
                    ? 'text-[var(--green)]'
                    : log.includes('[RUN]')
                    ? 'text-[var(--blue-bright)]'
                    : 'text-[var(--muted)]'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST INDICATORS ===== */}
      <section className="py-12 border-y border-[var(--line)] bg-[#0c1017]/50">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <div className="text-2xl md:text-3xl font-extrabold font-mono text-[var(--blue-bright)]">
                100%
              </div>
              <div className="text-xs text-[var(--muted)] mt-1 font-mono uppercase tracking-wider">
                {isAr ? 'كود مفحوص ومختبر' : 'Verified Execution'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <div className="text-2xl md:text-3xl font-extrabold font-mono text-[var(--purple)]">
                50MB
              </div>
              <div className="text-xs text-[var(--muted)] mt-1 font-mono uppercase tracking-wider">
                {isAr ? 'حد التخزين الرقمي' : 'Storage Standard'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <div className="text-2xl md:text-3xl font-extrabold font-mono text-[var(--green)]">
                0-Fee
              </div>
              <div className="text-xs text-[var(--muted)] mt-1 font-mono uppercase tracking-wider">
                {isAr ? 'تنزيلات فورية للمشتري' : 'Instant Buyer Downloads'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--line)]">
              <div className="text-2xl md:text-3xl font-extrabold font-mono text-[var(--orange)]">
                Cents
              </div>
              <div className="text-xs text-[var(--muted)] mt-1 font-mono uppercase tracking-wider">
                {isAr ? 'معيار الحساب بالسنت' : 'Integer Cents Standard'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED WORKBENCH ASSETS ===== */}
      <section className="py-20 container-custom">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[var(--blue-bright)] font-semibold block mb-2">
              {isAr ? 'أحدث الإضافات البرمجية' : 'APPROVED ENGINEERING TOOLS'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
              {isAr ? 'أدوات وسيناريوهات جاهزة للإنتاج' : 'Featured Marketplace Assets'}
            </h2>
          </div>

          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--blue-bright)] hover:underline"
          >
            <span>{isAr ? 'عرض الكتالوج الكامل' : 'Browse All Assets'}</span>
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
                  onDryRun={(p) => setSelectedProductForTerminal(p)}
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
              {isAr ? 'لا توجد أدوات معروضة حالياً.' : 'No public engineering assets uploaded yet.'}
            </p>
            <Link
              href={`/${locale}/dashboard?tab=upload`}
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-[var(--blue)] text-white text-xs font-semibold"
            >
              {isAr ? 'كن أول من ينشر أداة' : 'Be the first to submit a tool'}
            </Link>
          </div>
        )}
      </section>

      {/* Terminal Sandbox Modal */}
      <TerminalModal
        isOpen={Boolean(selectedProductForTerminal)}
        product={selectedProductForTerminal}
        onClose={() => setSelectedProductForTerminal(null)}
        locale={locale}
      />

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
        onOrderCompleted={(newProductId) => {
          setOwnedProductIds((prev) => [...prev, newProductId])
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
