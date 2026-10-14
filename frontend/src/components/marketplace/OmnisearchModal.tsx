'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Sparkles,
  Terminal,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Layers,
  CornerDownLeft,
  ExternalLink,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types'
import {
  formatCents,
  normalizeCategory,
  getCategoryVisualClass,
} from '@/lib/utils'
import { fetchApi } from '@/lib/api'

interface OmnisearchModalProps {
  isOpen: boolean
  onClose: () => void
  locale: string
}

export function OmnisearchModal({
  isOpen,
  onClose,
  locale,
}: OmnisearchModalProps) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [results, setResults] = useState<Product[]>([])
  const [resultTotal, setResultTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchError, setSearchError] = useState(false)

  const router = useRouter()
  const isAr = locale === 'ar'
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Search the database so the modal is not limited to whichever products a page preloaded.
  useEffect(() => {
    if (!isOpen) return
    let ignore = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setSearchError(false)
      const params = new URLSearchParams({ lang: locale, limit: '50' })
      if (query.trim()) params.set('search', query.trim().slice(0, 100))
      if (activeCategory !== 'all') params.set('category', activeCategory)
      try {
        const data = await fetchApi<{ items: Product[]; total: number }>(`/products?${params}`)
        if (!ignore) {
          setResults(data.items)
          setResultTotal(data.total)
        }
      } catch {
        if (!ignore) {
          setResults([])
          setResultTotal(0)
          setSearchError(true)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }, query ? 250 : 0)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [isOpen, locale, query, activeCategory])

  const categoryChips = useMemo(() => [
    { id: 'all', label: isAr ? 'جميع الأدوات' : 'All Assets', icon: Layers },
    { id: 'workflow', label: 'Workflows', icon: Sparkles },
    { id: 'agentic', label: 'AI Agents', icon: Cpu },
    { id: 'script', label: 'Scripts', icon: Terminal },
    { id: 'code', label: 'Code Base', icon: ShieldCheck },
  ], [isAr])
  const filtered = results
  const safeSelectedIndex = selectedIndex >= filtered.length ? 0 : selectedIndex

  const handleClose = useCallback(() => {
    setResults([])
    setResultTotal(0)
    setLoading(true)
    setQuery('')
    setActiveCategory('all')
    setSelectedIndex(0)
    onClose()
  }, [onClose])

  const handleQueryChange = (val: string) => {
    setLoading(true)
    setQuery(val)
    setSelectedIndex(0)
  }

  const handleCategoryChange = (catId: string) => {
    setLoading(true)
    setActiveCategory(catId)
    setSelectedIndex(0)
  }

  const handleSelect = useCallback((productId: string) => {
    handleClose()
    router.push(`/${locale}/products/${productId}`)
  }, [handleClose, locale, router])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handleClose()
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        // Cycle categories
        const currentIndex = categoryChips.findIndex((c) => c.id === activeCategory)
        const nextIndex = (currentIndex + 1) % categoryChips.length
        handleCategoryChange(categoryChips[nextIndex].id)
        return
      }

      if (filtered.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = filtered[safeSelectedIndex]
        if (selected) {
          handleSelect(selected.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, safeSelectedIndex, activeCategory, categoryChips, handleClose, handleSelect])

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector<HTMLElement>(`[data-index="${safeSelectedIndex}"]`)
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [safeSelectedIndex])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const getGlyphIcon = (cat: string) => {
    switch (normalizeCategory(cat)) {
      case 'workflow':
        return <Sparkles className="w-4 h-4 text-[#62a0ff]" />
      case 'agentic':
        return <Cpu className="w-4 h-4 text-[#bb86fc]" />
      case 'script':
        return <Terminal className="w-4 h-4 text-[#35d69f]" />
      case 'code':
        return <ShieldCheck className="w-4 h-4 text-[#f59e50]" />
      default:
        return <Terminal className="w-4 h-4 text-[#62a0ff]" />
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 md:pt-20 px-4 bg-slate-900/40 backdrop-blur-sm">
        {/* Backdrop click to dismiss */}
        <div className="fixed inset-0" onClick={handleClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -16 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* 62px Search Input Bar */}
          <div className="relative flex items-center px-4 h-[62px] border-b border-[var(--line)] bg-[var(--surface)]">
            <Search className="w-5 h-5 text-[var(--blue-bright)] ms-2 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث في السيناريوهات، الأكواد، أو وكلاء الذكاء الاصطناعي (⌘K)...'
                  : 'Search workflows, scripts, or agent skills (⌘K)...'
              }
              className="w-full h-full bg-transparent px-4 text-sm text-[var(--text)] placeholder-[var(--muted-2)] focus:outline-none font-sans"
            />
            {query ? (
              <button
                onClick={() => handleQueryChange('')}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] me-2 transition-colors"
                title={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-[var(--muted-2)] hover:text-[var(--text)] bg-[var(--surface-2)] border border-[var(--line)] rounded-md me-2 transition-colors"
              >
                <span>ESC</span>
              </button>
            )}
          </div>

          {/* Canonical Category Filter Chips */}
          <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--surface-2)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted-2)] font-semibold me-2 shrink-0">
              {isAr ? 'التصنيف:' : 'FILTER:'}
            </span>
            {categoryChips.map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium shrink-0 transition-all ${
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

          {/* Results List Section */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 min-h-[260px] max-h-[440px]">
            {loading ? (
              /* Skeleton Loader */
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--line)] animate-pulse flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)]" />
                      <div className="space-y-2">
                        <div className="w-48 h-3.5 rounded bg-[var(--surface-2)]" />
                        <div className="w-72 h-2.5 rounded bg-[var(--surface-2)]/60" />
                      </div>
                    </div>
                    <div className="w-16 h-4 rounded bg-[var(--surface-2)]" />
                  </div>
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-1">
                {/* Group Heading */}
                <div className="px-3 py-2 flex items-center justify-between text-[11px] font-mono text-[var(--muted-2)] uppercase tracking-wider">
                  <span>
                    {isAr ? `نتائج البحث (${resultTotal})` : `ASSETS (${resultTotal})`}
                  </span>
                  <span className="text-[10px] lowercase text-[var(--muted-2)] font-mono">
                    {isAr ? 'استخدم الأسهم للتنقل' : 'use ↑↓ to navigate'}
                  </span>
                </div>

                {filtered.map((prod, index) => {
                  const isSelected = index === safeSelectedIndex
                  const displayName = isAr && prod.nameAr ? prod.nameAr : prod.name
                  const displayDesc = isAr && prod.descriptionAr ? prod.descriptionAr : prod.description
                  const filePill = prod.fileExtension
                  const visualClass = getCategoryVisualClass(prod.category)
                  const normCat = normalizeCategory(prod.category)

                  return (
                    <button
                      key={prod.id}
                      data-index={index}
                      onClick={() => handleSelect(prod.id)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left rtl:text-right group ${
                        isSelected
                          ? 'bg-[var(--surface-3)] border border-[var(--blue)]/60 shadow-md'
                          : 'bg-transparent border border-transparent hover:bg-[var(--surface-2)]/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Frosted Glyph */}
                        <div
                          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border border-[var(--line)] shadow-sm ${visualClass}`}
                        >
                          {getGlyphIcon(prod.category)}
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm font-semibold truncate transition-colors ${
                                isSelected ? 'text-[var(--blue-bright)] font-bold' : 'text-[var(--text)]'
                              }`}
                            >
                              {displayName}
                            </h4>
                            {prod.version && <span className="text-[10px] font-mono text-[var(--muted-2)] shrink-0">v{prod.version}</span>}
                            {(isAr && prod.badgeAr ? prod.badgeAr : prod.badge) && (
                              <span className="text-[10px] font-mono text-[var(--green)] shrink-0">
                                {isAr && prod.badgeAr ? prod.badgeAr : prod.badge}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[var(--muted)] truncate mt-0.5 leading-normal max-w-md">
                            {displayDesc}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono">
                            {filePill && <span className="file-pill text-[9px] py-0 px-1.5">{filePill}</span>}
                            <span className="uppercase text-[var(--muted-2)]">
                              {normCat}
                            </span>
                            <span className="text-[var(--line-bright)]">•</span>
                            <span className="text-[var(--muted-2)] truncate max-w-[140px]">
                              {prod.sellerName || (isAr ? 'الناشر غير متاح' : 'Seller unavailable')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Price & Select Keycap */}
                      <div className="flex items-center gap-3 shrink-0 ms-3">
                        <span className="font-mono text-xs font-bold text-[var(--text)]">
                          {formatCents(prod.price)}
                        </span>

                        {isSelected ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--blue)] text-white text-[10px] font-mono font-semibold shadow-sm">
                            <span>{isAr ? 'فتح' : 'Open'}</span>
                            <CornerDownLeft className="w-3 h-3 rtl:rotate-180" />
                          </div>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-[var(--muted-2)] opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : searchError ? (
              <div role="alert" className="p-8 text-center text-sm text-[var(--rose)]">
                {isAr ? 'تعذر تحميل نتائج البحث.' : 'Could not load search results.'}
              </div>
            ) : (
              /* Search Miss / Empty State */
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--line-bright)] flex items-center justify-center mb-3 text-[var(--muted)]">
                  <Terminal className="w-6 h-6 text-[var(--blue-bright)]" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  {isAr
                    ? `لم يتم العثور على أدوات تطابق "${query}"`
                    : `No engineering assets found matching "${query}"`}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1.5 max-w-sm leading-relaxed">
                  {isAr
                    ? 'جرب البحث باسم الأداة (مثل n8n، Postgres، Python) أو أعد ضبط التصنيف المختار.'
                    : 'Try searching by workflow keyword, language, or clear the category filter.'}
                </p>

                <div className="flex items-center gap-2 mt-5">
                  {query && (
                    <button
                      onClick={() => handleQueryChange('')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] border border-[var(--line)] transition-colors"
                    >
                      {isAr ? 'مسح البحث' : 'Clear search text'}
                    </button>
                  )}
                  {activeCategory !== 'all' && (
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] border border-[var(--line)] transition-colors"
                    >
                      {isAr ? 'عرض جميع الأقسام' : 'Reset category filter'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleClose()
                      router.push(`/${locale}/products`)
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{isAr ? 'تصفح الكتالوج الكامل' : 'Browse Catalog'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Command Keyboard Legend Footer */}
          <div className="p-3 border-t border-[var(--line)] bg-[var(--surface-2)] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-[var(--muted-2)]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
              <span>
                {resultTotal} {isAr ? 'أصل مطابق' : 'matching assets'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[10px] text-[var(--text)]">
                  ↑↓
                </kbd>
                <span>{isAr ? 'تنقل' : 'Navigate'}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[10px] text-[var(--text)]">
                  ↵
                </kbd>
                <span>{isAr ? 'فتح' : 'Open'}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[10px] text-[var(--text)]">
                  Tab
                </kbd>
                <span>{isAr ? 'القسم' : 'Category'}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[10px] text-[var(--text)]">
                  Esc
                </kbd>
                <span>{isAr ? 'إغلاق' : 'Close'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
