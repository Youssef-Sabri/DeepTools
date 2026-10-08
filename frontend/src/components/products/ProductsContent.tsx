'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Database, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { fetchApi } from '@/lib/api'
import type { Dictionary } from '@/dictionaries'

interface ProductsContentProps {
  dict: Dictionary
  locale: string
}

interface Product {
  id: string
  name: string
  nameAr?: string | null
  displayName?: string
  description: string
  descriptionAr?: string | null
  displayDescription?: string
  category: string
  price: number
  badge: string | null
  badgeAr?: string | null
  displayBadge?: string | null
  version: string
}

export default function ProductsContent({ dict, locale }: ProductsContentProps) {
  const [productsList, setProductsList] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)

  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchApi(`/products?lang=${locale}`)
        setProductsList(data)
      } catch (err) {
        console.error('Failed to load products:', err)
      } finally {
        setLoadingProducts(false)
      }
    }
    loadProducts()
  }, [locale])

  const handlePurchase = async (productId: string) => {
    if (!user) {
      router.push(`/${locale}/auth/login`)
      return
    }
    setPurchaseLoading(productId)
    try {
      await fetchApi(`/products/${productId}/purchase`, {
        method: 'POST',
      })
      alert('Purchase successful! Your license key is now available in your Dashboard.')
      router.push(`/${locale}/dashboard`)
    } catch (err: any) {
      alert(err.message || 'Purchase failed. Please try again.')
    } finally {
      setPurchaseLoading(null)
    }
  }

  const categoryMap: Record<string, string> = {
    all: 'all',
    aiAgents: 'aiAgents',
    utilities: 'utilities',
    scripts: 'scripts',
    templates: 'templates',
  }

  const filteredProducts = productsList.filter((product) => {
    const categoryKey = categoryMap[activeCategory]
    const matchesCategory = activeCategory === 'all' || product.category === categoryKey
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden section-padding">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="container-custom relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold">{dict.products.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{dict.products.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Filters & Grid */}
      <section className="section-padding pt-0">
        <div className="container-custom">
          {/* Search */}
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={dict.templates.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-12 pe-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {Object.entries(dict.products.categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeCategory === key
                    ? 'bg-accent-cyan text-white shadow-md shadow-accent-cyan/25'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-accent-cyan/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loadingProducts ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex flex-col p-6 rounded-2xl bg-card border border-border hover-glow"
                  >
                    {(product.displayBadge || (locale === 'ar' && product.badgeAr ? product.badgeAr : product.badge)) && (
                      <span className="absolute top-4 end-4 px-3 py-1 text-xs font-semibold rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                        {product.displayBadge || (locale === 'ar' && product.badgeAr ? product.badgeAr : product.badge)}
                      </span>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center mb-4">
                      <Database className="w-6 h-6 text-accent-cyan" />
                    </div>
                    <span className="text-xs font-medium text-accent-violet mb-2">
                      {dict.products.categories[product.category as keyof typeof dict.products.categories] || product.category}
                    </span>
                    <h3 className="text-lg font-semibold mb-2">
                      {product.displayName || (locale === 'ar' && product.nameAr ? product.nameAr : product.name)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {product.displayDescription || (locale === 'ar' && product.descriptionAr ? product.descriptionAr : product.description)}
                    </p>
                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xl font-bold gradient-text">
                        ${(product.price / 100).toFixed(2)}/mo
                      </span>
                      <button
                        onClick={() => handlePurchase(product.id)}
                        disabled={purchaseLoading === product.id}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300 hover:scale-105 disabled:opacity-50"
                      >
                        {purchaseLoading === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : dict.products.buyNow}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loadingProducts && filteredProducts.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">No products found matching your criteria.</div>
          )}
        </div>
      </section>
    </>
  )
}
