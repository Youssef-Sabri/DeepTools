'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Terminal,
  X,
  Layers,
  ArrowUpDown,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import type { Product, License, Category } from '@/lib/types'
import { fetchApi, downloadProductFile, fetchCategories } from '@/lib/api'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { CartDrawer } from '@/components/marketplace/CartDrawer'
import { DownloadOverlay } from '@/components/marketplace/DownloadOverlay'
import { useDictionary } from '@/components/providers/DictionaryProvider'

interface ProductsContentProps {
  locale: string
}

export default function ProductsContent({ locale }: ProductsContentProps) {
  const dict = useDictionary()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [products, setProducts] = useState<Product[]>([])
  const [ownedProductIds, setOwnedProductIds] = useState<string[]>([])
  const [guestOwnedProductIds, setGuestOwnedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest')

  // Modals & Drawers state
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
  const couldNotLoadProducts = dict.catalog.couldNotLoadProducts
  const couldNotLoadCategories = dict.catalog.couldNotLoadCategories

  useEffect(() => {
    let isMounted = true
    const timer = setTimeout(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        setCatalogError(null)
        const query = new URLSearchParams({ lang: locale, limit: '50', page: '1', sort: sortBy })
        if (activeCategory !== 'all') query.set('category', activeCategory)
        if (searchQuery.trim()) query.set('search', searchQuery.trim().slice(0, 100))
        const data = await fetchApi<{ items: Product[]; totalPages: number }>(`/products?${query}`)
        if (!isMounted) return
        setProducts(data.items)
        setPage(1)
        setTotalPages(data.totalPages)
      } catch (err) {
        console.error('Failed to load marketplace products:', err)
        if (isMounted) setCatalogError(couldNotLoadProducts)
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
  }, [locale, activeCategory, searchQuery, sortBy, isAr, couldNotLoadProducts])

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return
    setLoadingMore(true)
    setCatalogError(null)
    try {
      const query = new URLSearchParams({ lang: locale, limit: '50', page: String(page + 1), sort: sortBy })
      if (activeCategory !== 'all') query.set('category', activeCategory)
      if (searchQuery.trim()) query.set('search', searchQuery.trim().slice(0, 100))
      const data = await fetchApi<{ items: Product[]; totalPages: number }>(`/products?${query}`)
      setProducts((previous) => [...previous, ...data.items])
      setPage((previous) => previous + 1)
      setTotalPages(data.totalPages)
    } catch {
      setCatalogError(dict.catalog.couldNotLoadMoreProducts)
    } finally { setLoadingMore(false) }
  }

  useEffect(() => {
    let ignore = false

    const checkOwnership = () => {
      if (user) {
        fetchApi<License[]>('/products/my/licenses')
          .then((data) => {
            if (ignore) return
            setOwnedProductIds(
              data.filter((license) => license.isActive && (!license.expiresAt || new Date(license.expiresAt) > new Date()))
                .map((license) => license.productId)
            )
            setGuestOwnedProductIds([])
          })
          .catch(() => {})
      } else {
        fetchApi<{ email: string; purchases: Array<{ productId: string }> }>('/orders/guest/purchases')
          .then((data) => {
            if (ignore) return
            if (data?.purchases && Array.isArray(data.purchases)) {
              const ids = data.purchases.map((p) => p.productId)
              setOwnedProductIds(ids)
              setGuestOwnedProductIds(ids)
            } else {
              setOwnedProductIds([])
              setGuestOwnedProductIds([])
            }
          })
          .catch(() => {
            if (ignore) return
            setOwnedProductIds([])
            setGuestOwnedProductIds([])
          })
      }
    }

    checkOwnership()

    const handleSessionUpdate = () => {
      checkOwnership()
    }
    window.addEventListener('guest:session_updated', handleSessionUpdate)

    return () => {
      ignore = true
      window.removeEventListener('guest:session_updated', handleSessionUpdate)
    }
  }, [user])

  const [categoriesList, setCategoriesList] = useState<Category[]>([])
  const [categoryError, setCategoryError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    fetchCategories()
      .then((cats) => {
        if (!ignore) {
          setCategoriesList(Array.isArray(cats) ? cats : [])
          setCategoryError(null)
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err)
        if (!ignore) setCategoryError(couldNotLoadCategories)
      })
    return () => {
      ignore = true
    }
  }, [isAr, couldNotLoadCategories])

  // Categories come from GET /api/v1/categories; the UI must never hardcode a
  // static list or silently substitute one when the API fails (FRONTEND_RULES.md 2.8).
  const categories = [
    { id: 'all', label: dict.common.allAssets, icon: Layers, count: undefined },
    ...categoriesList.map((cat) => ({
      id: cat.slug,
      label: isAr && cat.nameAr ? cat.nameAr : cat.name,
      icon: getCategoryIcon(cat.slug),
      count: cat.productCount,
    })),
  ]

  const handleDownload = async (productId: string) => {
    const target = products.find((p) => p.id === productId)
    const extension = target?.fileExtension || ''
    const name = target?.name ? (extension && !target.name.toLowerCase().endsWith(extension.toLowerCase()) ? `${target.name}${extension}` : target.name) : 'asset'

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
      alert(dict.catalog.downloadFailedEnsureYouOwnThisTool)
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
            <span>{dict.catalog.verifiedDigitalMarketplace}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--text)]">
            {dict.catalog.developerAssetCatalog}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            {dict.catalog.browseApprovedWorkflowsScriptsAndCodeAsset}
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
                dict.catalog.searchByTitleDescriptionOrKeyword
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
              <option value="newest">{dict.catalog.newest}</option>
              <option value="priceAsc">{dict.catalog.priceLowToHigh}</option>
              <option value="priceDesc">{dict.catalog.priceHighToLow}</option>
            </select>
          </div>
        </div>

        {/* Category Chips Bar */}
        {categoryError && (
          <p role="alert" className="mb-4 text-center text-sm text-[var(--rose)]">
            {categoryError}
          </p>
        )}
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
                {typeof cat.count === 'number' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600 border border-[var(--line)]'}`}>
                    {cat.count}
                  </span>
                )}
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
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const isOwned =
                ownedProductIds.includes(product.id) ||
                (Boolean(user) && user?.id === product.sellerId)
              const isGuestOwned = !user && guestOwnedProductIds.includes(product.id)

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  isOwned={isOwned}
                  isGuestOwned={isGuestOwned}
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
              {dict.catalog.noToolsFound}
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
              {dict.catalog.noResultsHint}
            </p>
          </div>
        )}
        {catalogError && <p role="alert" className="mt-4 text-center text-sm text-[var(--rose)]">{catalogError}</p>}
        {!loading && page < totalPages && (
          <button onClick={loadMore} disabled={loadingMore} className="mt-8 mx-auto block rounded-lg border border-[var(--line)] px-5 py-2 text-sm text-[var(--text)] disabled:opacity-50">
            {loadingMore ? (dict.catalog.loading) : (dict.catalog.loadMore)}
          </button>
        )}
      </div>

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
        isGuestOwned={
          selectedProductForCart
            ? !user && guestOwnedProductIds.includes(selectedProductForCart.id)
            : false
        }
        onOrderCompleted={(newProductId) => {
          setOwnedProductIds((prev) => [...new Set([...prev, newProductId])])
          if (!user) {
            setGuestOwnedProductIds((prev) => [...new Set([...prev, newProductId])])
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
    </div>
  )
}
