'use client'

import Link from 'next/link'
import { Download, ShoppingCart, CheckCircle2, ShieldCheck } from 'lucide-react'
import type { Product } from '@/lib/types'
import { formatCents, formatBytes, formatDate, getCategoryVisualClass, getFileExtensionPill } from '@/lib/utils'
import { getCategoryVisual } from '@/lib/categoryIcons'
import { useDictionary } from '@/components/providers/DictionaryProvider'

interface ProductCardProps {
  product: Product
  locale: string
  onBuy?: (product: Product) => void
  onDownload?: (productId: string) => void
  isOwned?: boolean
}

export function ProductCard({ product, locale, onBuy, onDownload, isOwned = false }: ProductCardProps) {
  const dict = useDictionary()
  const isArabic = locale === 'ar'
  const displayName = product.displayName || (isArabic && product.nameAr ? product.nameAr : product.name)
  const displayDescription = product.displayDescription || (isArabic && product.descriptionAr ? product.descriptionAr : product.description)
  const sellerName = product.sellerName?.trim() || product.seller?.name?.trim() || null
  const badge = (product.displayBadge || (isArabic && product.badgeAr ? product.badgeAr : product.badge))?.trim()
  const fileExtension = product.fileExtension || (product.fileKey ? getFileExtensionPill(product.fileKey) : null)
  const categoryVisual = getCategoryVisual(product.category)
  const CategoryIcon = categoryVisual.icon

  return (
    <article className="deeptools-card product-card group flex h-full flex-col overflow-hidden rounded-[1.4rem]">
      <Link href={`/${locale}/products/${product.id}`} className="flex min-w-0 flex-1 flex-col" aria-label={displayName}>
        <div className={`relative flex h-44 items-center justify-center overflow-hidden border-b border-[var(--line)] ${getCategoryVisualClass(product.category)}`}>
          <div className="absolute inset-0 opacity-40 [background:linear-gradient(115deg,transparent_42%,rgba(255,255,255,0.055)_50%,transparent_57%)]" aria-hidden="true" />
          <span className="product-glyph flex h-20 w-20 items-center justify-center rounded-[1.35rem] transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
            <CategoryIcon className={`h-9 w-9 ${categoryVisual.accent}`} />
          </span>
          {badge && <span className="absolute end-4 top-4 max-w-[55%] truncate rounded-full border border-[var(--line-bright)] bg-[var(--bg)]/65 px-3 py-1 text-xs font-medium text-[var(--text)] backdrop-blur-md">{badge}</span>}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[var(--text)] transition-colors group-hover:text-[var(--blue-bright)]">{displayName}</h3>
          <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-[var(--muted)]">
            <span className="truncate">{sellerName || dict.product.sellerUnavailable}</span>
            {(product.status === 'APPROVED' || product.publishedAt) && <span title={dict.product.approvedAsset} aria-label={dict.product.approvedAsset} className="inline-flex shrink-0 text-[var(--teal)]"><ShieldCheck className="h-4 w-4" /></span>}
          </div>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{displayDescription}</p>
        </div>
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-5">
        <div>
          <span className="block text-xs text-[var(--muted-2)]">{dict.product.priceLabel}</span>
          <strong className="block font-mono text-xl font-bold tracking-tight text-[var(--text)]">{formatCents(product.price)}</strong>
        </div>
        {isOwned ? (
          <button type="button" onClick={() => onDownload?.(product.id)} className="premium-button inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--blue)] px-4 text-sm font-semibold text-white hover:bg-[var(--blue-hover)]">
            <Download className="h-4 w-4" />{dict.product.download}
          </button>
        ) : (
          <button type="button" onClick={() => onBuy?.(product)} className="premium-button inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--blue)] px-4 text-sm font-semibold text-white hover:bg-[var(--blue-hover)]">
            <ShoppingCart className="h-4 w-4" />{dict.product.buyAsset}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--line)] bg-[var(--bg-soft)]/45 px-6 py-3 font-mono text-[11px] text-[var(--muted-2)]">
        <span>{product.category}</span>
        {fileExtension && <span>{fileExtension}</span>}
        {product.version && <span>v{product.version}</span>}
        {product.fileSize != null && <span>{formatBytes(product.fileSize)}</span>}
        <span>{formatDate(product.publishedAt || product.createdAt, locale)}</span>
        {isOwned && <span className="ms-auto inline-flex items-center gap-1 text-[var(--green)]"><CheckCircle2 className="h-3 w-3" />{dict.product.ownedInLibrary}</span>}
      </div>
    </article>
  )
}
