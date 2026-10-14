'use client'

import Link from 'next/link'
import { Terminal, Download, ShoppingCart, Sparkles, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react'
import type { Product } from '@/lib/types'
import { formatCents, formatBytes, formatDate, getCategoryVisualClass, getFileExtensionPill, normalizeCategory } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  locale: string
  onBuy?: (product: Product) => void
  onDownload?: (productId: string) => void
  isOwned?: boolean
}

export function ProductCard({
  product,
  locale,
  onBuy,
  onDownload,
  isOwned = false,
}: ProductCardProps) {
  const isArabic = locale === 'ar'
  const displayName = (isArabic && product.nameAr) ? product.nameAr : product.name
  const displayDescription = (isArabic && product.descriptionAr) ? product.descriptionAr : product.description
  const visualClass = getCategoryVisualClass(product.category)
  const filePill = product.fileExtension || (product.fileKey ? getFileExtensionPill(product.fileKey) : null)
  const normCategory = normalizeCategory(product.category)
  const sellerName = product.sellerName?.trim() || product.seller?.name?.trim() || null
  const badge = (isArabic && product.badgeAr ? product.badgeAr : product.badge)?.trim()

  const getCategoryGlyph = () => {
    switch (normCategory) {
      case 'workflow':
        return <Sparkles className="w-6 h-6 text-[#62a0ff]" />
      case 'agentic':
        return <Cpu className="w-6 h-6 text-[#bb86fc]" />
      case 'script':
        return <Terminal className="w-6 h-6 text-[#35d69f]" />
      case 'code':
        return <ShieldCheck className="w-6 h-6 text-[#f59e50]" />
      default:
        return <Terminal className="w-6 h-6 text-[#62a0ff]" />
    }
  }

  const sellerInitials = sellerName ? sellerName.slice(0, 2).toUpperCase() : '—'

  return (
    <div className="deeptools-card rounded-xl overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Visual Header with Radial Category Backdrop */}
        <div className={`relative h-44 w-full ${visualClass} flex items-center justify-center overflow-hidden border-b border-[var(--line)]`}>
          {/* Frosted Glyph */}
          <div className="product-glyph w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg">
            {getCategoryGlyph()}
          </div>

          {/* Category Chip at Top-Left */}
          <div className="absolute top-3 start-3">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-[#080b10]/70 text-[var(--text)] border border-[var(--line)] backdrop-blur-sm">
              {normCategory}
            </span>
          </div>
          {badge && (
            <span className="absolute top-3 end-3 px-2.5 py-1 rounded bg-[#080b10]/70 text-[var(--green)] border border-[var(--line)] text-[10px] font-mono">
              {badge}
            </span>
          )}

          {/* Bottom-Right File Extension Pill */}
          {filePill && <div className="absolute bottom-3 end-3">
            <span className="file-pill">
              {filePill}
            </span>
          </div>}
        </div>

        {/* Content Body */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-[var(--surface-3)] border border-[var(--line)] text-[10px] font-mono flex items-center justify-center text-[var(--muted)]">
              {sellerInitials}
            </div>
            <span className="text-xs text-[var(--muted-2)] font-mono">
              {sellerName || (isArabic ? 'الناشر غير متاح' : 'Seller unavailable')}
            </span>
          </div>

          <Link href={`/${locale}/products/${product.id}`} className="block group-hover:text-[var(--blue-bright)] transition-colors">
            <h3 className="text-base font-semibold text-[var(--text)] line-clamp-1">
              {displayName}
            </h3>
          </Link>

          <p className="mt-2 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
            {displayDescription}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-[var(--muted-2)]">
            {product.version && <span>v{product.version}</span>}
            {product.fileSize != null && <span>{formatBytes(product.fileSize)}</span>}
            <span>{formatDate(product.publishedAt || product.createdAt, locale)}</span>
          </div>
        </div>
      </div>

      {/* Card Footer with Price and Actions */}
      <div className="p-5 pt-0 mt-3 flex items-center justify-between border-t border-[var(--line)]/50 pt-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted-2)] block">
            {isOwned ? (isArabic ? 'متاح لك' : 'Accessible') : (isArabic ? 'السعر' : 'Price')}
          </span>
          <span className="text-lg font-bold font-mono text-[var(--text)]">
            {isOwned ? (
              <span className="text-xs text-[var(--green)] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isArabic ? 'متاح لك' : 'Accessible'}
              </span>
            ) : (
              formatCents(product.price)
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOwned ? (
            <button
              onClick={() => onDownload && onDownload(product.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--green)] hover:bg-[#2bc48d] text-[#080b10] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              {isArabic ? 'تحميل' : 'Download'}
            </button>
          ) : (
            <button
              onClick={() => onBuy && onBuy(product)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white transition-colors shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {isArabic ? 'شراء' : 'Buy Asset'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
