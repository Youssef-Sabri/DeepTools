'use client'

import Link from 'next/link'
import { Download, ShoppingCart, CheckCircle2 } from 'lucide-react'
import type { Product } from '@/lib/types'
import { formatCents, formatBytes, formatDate, getCategoryVisualClass, getFileExtensionPill, normalizeCategory } from '@/lib/utils'
import { getCategoryVisual } from '@/lib/categoryIcons'
import { useDictionary } from '@/components/providers/DictionaryProvider'

interface ProductCardProps {
  product: Product
  locale: string
  onBuy?: (product: Product) => void
  onDownload?: (productId: string) => void
  isOwned?: boolean
  isGuestOwned?: boolean
}

export function ProductCard({
  product,
  locale,
  onBuy,
  onDownload,
  isOwned = false,
  isGuestOwned = false,
}: ProductCardProps) {
  const dict = useDictionary()
  const isArabic = locale === 'ar'
  const displayName = product.displayName || ((isArabic && product.nameAr) ? product.nameAr : product.name)
  const displayDescription = product.displayDescription || ((isArabic && product.descriptionAr) ? product.descriptionAr : product.description)
  const visualClass = getCategoryVisualClass(product.category)
  const filePill = product.fileExtension || (product.fileKey ? getFileExtensionPill(product.fileKey) : null)
  const normCategory = normalizeCategory(product.category)
  const sellerName = product.sellerName?.trim() || product.seller?.name?.trim() || null
  const badge = (product.displayBadge || (isArabic && product.badgeAr ? product.badgeAr : product.badge))?.trim()

  const categoryVisual = getCategoryVisual(normCategory)
  const CategoryIcon = categoryVisual.icon

  const getCategoryGlyph = () => {
    return <CategoryIcon className={`w-6 h-6 ${categoryVisual.accent}`} />
  }

  const sellerInitials = sellerName ? sellerName.slice(0, 2).toUpperCase() : '—'

  return (
    <div className="deeptools-card rounded-xl overflow-hidden flex flex-col justify-between group">
      <Link
        href={`/${locale}/products/${product.id}`}
        className="flex flex-col flex-1 block focus:outline-none cursor-pointer"
        aria-label={displayName}
      >
        {/* Visual Header with Radial Category Backdrop */}
        <div className={`relative h-44 w-full ${visualClass} flex items-center justify-center overflow-hidden border-b border-[var(--line)]`}>
          {/* Frosted Glyph */}
          <div className="product-glyph w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm">
            {getCategoryGlyph()}
          </div>

          {/* Category Chip at Top-Left */}
          <div className="absolute top-3 start-3">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-white/90 text-[var(--text)] border border-[var(--line)] backdrop-blur-sm shadow-xs">
              {normCategory}
            </span>
          </div>
          {isOwned ? (
            <span
              className={`absolute top-3 end-3 px-2.5 py-1 rounded text-[10px] font-mono shadow-xs flex items-center gap-1 font-semibold backdrop-blur-xs ${
                isGuestOwned
                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                  : 'bg-[var(--blue)]/15 text-[var(--blue-bright)] border border-[var(--blue)]/30'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              {isGuestOwned
                ? (dict.product.ownedLifetime)
                : (dict.product.ownedInLibrary)}
            </span>
          ) : badge ? (
            <span className="absolute top-3 end-3 px-2.5 py-1 rounded bg-white/90 text-[var(--green)] border border-[var(--line)] text-[10px] font-mono shadow-xs">
              {badge}
            </span>
          ) : null}

          {/* Bottom-Right File Extension Pill */}
          {filePill && <div className="absolute bottom-3 end-3">
            <span className="file-pill">
              {filePill}
            </span>
          </div>}
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-[var(--surface-3)] border border-[var(--line)] text-[10px] font-mono flex items-center justify-center text-[var(--muted)]">
              {sellerInitials}
            </div>
            <span className="text-xs text-[var(--muted-2)] font-mono">
              {sellerName || (dict.product.sellerUnavailable)}
            </span>
          </div>

          <h3 className="text-base font-semibold text-[var(--text)] line-clamp-1 group-hover:text-[var(--blue-bright)] transition-colors">
            {displayName}
          </h3>

          <p className="mt-2 text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
            {displayDescription}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-[var(--muted-2)]">
            {product.version && <span>v{product.version}</span>}
            {product.fileSize != null && <span>{formatBytes(product.fileSize)}</span>}
            <span>{formatDate(product.publishedAt || product.createdAt, locale)}</span>
          </div>
        </div>
      </Link>

      {/* Card Footer with Price and Actions */}
      <div className="p-5 pt-0 mt-3 flex items-center justify-between border-t border-[var(--line)]/50 pt-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted-2)] block">
            {isOwned
              ? (dict.product.licenseStatus)
              : (dict.product.priceLabel)}
          </span>
          <span className="text-lg font-bold font-mono text-[var(--text)]">
            {isOwned ? (
              <span
                className={`text-xs flex items-center gap-1 font-semibold ${
                  isGuestOwned ? 'text-emerald-600' : 'text-[var(--blue-bright)]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {dict.product.lifetimeLicense}
              </span>
            ) : (
              formatCents(product.price)
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOwned ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDownload?.(product.id)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs ${
                isGuestOwned
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[var(--blue)] hover:bg-[var(--blue-bright)]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              {dict.product.download}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onBuy?.(product)
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white transition-colors shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {dict.product.buyAsset}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
