'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Sparkles,
  Terminal,
  Cpu,
  ShieldCheck,
  X,
  Layers,
  ArrowUpDown,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import type { Product, License } from '@/lib/types'
import { normalizeCategory } from '@/lib/utils'
import { fetchApi, downloadProductFile } from '@/lib/api'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { TerminalModal } from '@/components/marketplace/TerminalModal'
import { CartDrawer } from '@/components/marketplace/CartDrawer'
import { DownloadOverlay } from '@/components/marketplace/DownloadOverlay'
import type { Dictionary } from '@/dictionaries'

interface ProductsContentProps {
  dict?: Dictionary
  locale: string
}

export default function ProductsContent({ locale }: ProductsContentProps) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [products, setProducts] = useState<Product[]>([])
  const [ownedProductIds, setOwnedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest')

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
    const timer = setTimeout(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        setCatalogError(null)
        const query = new URLSearchParams({ lang: locale, limit: '50', page: '1', sort: sortBy })
        if (activeCategory !== 'all') query.set('category', activeCategory)
        if (searchQuery.trim()) query.set('search', searchQuery.trim())
        const data = await fetchApi<{ items: Product[]; totalPages: number }>(`/products?${query}`)
        if (!isMounted) return
        setProducts(data.items)
        setPage(1)
        setTotalPages(data.totalPages)
      } catch (err) {
        console.error('Failed to load marketplace products:', err)
        if (isMounted) setCatalogError(isAr ? 'تعذر تحميل الأدوات.' : 'Could not load products.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadProducts()
    }, 250)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [locale, activeCategory, searchQuery, sortBy, isAr])

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return
    setLoadingMore(true)
    setCatalogError(null)
    try {
      const query = new URLSearchParams({ lang: locale, limit: '50', page: String(page + 1), sort: sortBy })
      if (activeCategory !== 'all') query.set('category', activeCategory)
      if (searchQuery.trim()) query.set('search', searchQuery.trim())
      const data = await fetchApi<{ items: Product[]; totalPages: number }>(`/products?${query}`)
      setProducts((previous) => [...previous, ...data.items])
      setPage((previous) => previous + 1)
      setTotalPages(data.totalPages)
    } catch {
      setCatalogError(isAr ? 'تعذر تحميل المزيد.' : 'Could not load more products.')
    } finally { setLoadingMore(false) }
  }

  useEffect(() => {
    if (!user) { setOwnedProductIds([]); return }
    let ignore = false
    fetchApi<License[]>('/products/my/licenses')
      .then((data) => {
        if (ignore) return
        setOwnedProductIds(
          data.filter((license) => license.isActive && (!license.expiresAt || new Date(license.expiresAt) > new Date()))
            .map((license) => license.productId)
        )
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [user])

  const categories = [
    { id: 'all', label: isAr ? 'جميع الأدوات' : 'All Assets', icon: Layers },
    { id: 'workflow', label: 'Workflows (n8n/Make)', icon: Sparkles },
    { id: 'agentic', label: 'AI Agents', icon: Cpu },
    { id: 'script', label: 'Scripts (Python/Bash)', icon: Terminal },
    { id: 'code', label: 'Code Base', icon: ShieldCheck },
  ]

  const filteredProducts = products.filter((prod) => {
    const norm = normalizeCategory(prod.category)
    const matchesCategory = activeCategory === 'all' || norm === activeCategory || prod.category === activeCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      prod.name.toLowerCase().includes(q) ||
      (prod.nameAr && prod.nameAr.toLowerCase().includes(q)) ||
      prod.description.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'priceAsc') return a.price - b.price
    if (sortBy === 'priceDesc') return b.price - a.price
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const handleDownload = async (productId: string) => {
    const target = products.find((p) => p.id === productId)
    const name = `${target?.name || 'asset'}.zip`

    setDownloadState({
      isVisible: true,
      fileName: name,
      progress: 25,
      isComplete: false,
    })

    try {
      setTimeout(() => {
        setDownloadState((prev) => ({ ...prev, progress: 80 }))
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
      alert(isAr ? 'فشل التنزيل. يرجى التأكد من شراء الأداة.' : 'Download failed. Ensure you own this tool.')
    }
  }

  return (
    <div className="relative overflow-hidden blueprint-grid min-h-screen py-10 md:py-16">
      {/* Ambient Lighting Orbs */}
      <div className="ambient-glow-blue top-[10%] start-[5%]" />
      <div className="ambient-glow-purple top-[40%] end-[10%]" />

      <div className="container-custom relative z-10">
        {/* Page Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--line-bright)] text-[11px] font-mono text-[var(--blue-bright)] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue-bright)]" />
            <span>{isAr ? 'كتالوج الحلول المعتمدة' : 'VERIFIED DIGITAL MARKETPLACE'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)]">
            {isAr ? 'أدوات وسيناريوهات الأتمتة' : 'Developer Asset Catalog'}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            {isAr
              ? 'تصفح سيناريوهات العمل، نصوص Python، مهارات وكلاء الذكاء الاصطناعي، والقوالب البرمجية الجاهزة للاستخدام الفوري.'
              : 'Browse production-ready workflows, scripts, and autonomous agent skills with dry-run verification.'}
          </p>
        </div>

        {/* 62px Omnisearch Bar */}
        <div className="mb-8 p-1.5 rounded-2xl bg-[var(--surface)] border border-[var(--line-bright)] shadow-xl flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full flex items-center h-[52px]">
            <Search className="w-5 h-5 text-[var(--muted)] ms-4 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث بالاسم، الوصف، أو الكلمات المفتاحية...'
                  : 'Search by title, description, or keyword...'
              }
              className="w-full h-full bg-transparent px-4 text-sm text-[var(--text)] placeholder-[var(--muted-2)] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--text)] me-3"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="w-full md:w-auto flex items-center justify-end px-3 pb-2 md:pb-0 gap-2">
            <ArrowUpDown className="w-4 h-4 text-[var(--muted-2)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'priceAsc' | 'priceDesc')}
              className="bg-[var(--surface-2)] text-xs text-[var(--text)] border border-[var(--line)] rounded-lg px-3 py-2 focus:outline-none font-mono"
            >
              <option value="newest">{isAr ? 'الأحدث أولاً' : 'Newest'}</option>
              <option value="priceAsc">{isAr ? 'الأقل سعراً' : 'Price: Low to High'}</option>
              <option value="priceDesc">{isAr ? 'الأعلى سعراً' : 'Price: High to Low'}</option>
            </select>
          </div>
        </div>

        {/* Category Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium shrink-0 transition-all ${
                  isActive
                    ? 'bg-[var(--blue)] text-white shadow-md shadow-[var(--blue)]/20 border border-[var(--blue-bright)]'
                    : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border border-[var(--line)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-80 rounded-xl bg-[var(--surface)] border border-[var(--line)] animate-pulse"
              />
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product) => {
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
          <div className="py-20 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)] p-8">
            <Terminal className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
            <h3 className="text-base font-bold text-[var(--text)]">
              {isAr ? 'لم يتم العثور على نتائج' : 'No Tools Found'}
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
              {isAr
                ? 'جرب البحث بكلمات أخرى أو اختر قسماً مختلفاً من الأعلى.'
                : 'Try adjusting your search criteria or switch to another canonical category.'}
            </p>
          </div>
        )}
        {catalogError && <p role="alert" className="mt-4 text-center text-sm text-[var(--rose)]">{catalogError}</p>}
        {!loading && page < totalPages && (
          <button onClick={loadMore} disabled={loadingMore} className="mt-8 mx-auto block rounded-lg border border-[var(--line)] px-5 py-2 text-sm text-[var(--text)] disabled:opacity-50">
            {loadingMore ? (isAr ? 'جارٍ التحميل...' : 'Loading...') : (isAr ? 'عرض المزيد' : 'Load more')}
          </button>
        )}
      </div>

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
