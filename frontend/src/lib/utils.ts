import { clsx, type ClassValue } from 'clsx'
import type { ProductCategory } from './types'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

/** Format integer cents into USD currency string (e.g. 4900 => "$49.00") */
export function formatCents(cents: number | undefined | null): string {
  if (typeof cents !== 'number' || isNaN(cents)) return '$0.00'
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Convert dollar number or string to integer cents (e.g. 49.99 => 4999) */
export function dollarsToCents(dollars: number | string): number {
  const val = typeof dollars === 'string' ? parseFloat(dollars) : dollars
  if (isNaN(val)) return 0
  return Math.round(val * 100)
}

/** Format bytes into human-readable size (KB, MB, GB) */
export function formatBytes(bytes: number | undefined | null): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—'
  if (bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Format ISO date string into readable date */
export function formatDate(dateString: string | undefined | null, locale: string = 'en'): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return dateString
  }
}

/** Normalize any DB category slug to one of the 4 canonical Phase 1 categories */
export function normalizeCategory(cat?: string | null): ProductCategory {
  const c = (cat || '').toLowerCase()
  if (c === 'agentic' || c === 'aiagents') return 'agentic'
  if (c === 'script' || c === 'scripts') return 'script'
  if (c === 'code' || c === 'utilities') return 'code'
  if (c === 'workflow' || c === 'templates') return 'workflow'
  return 'workflow'
}

/** Return category visual styling classes based on FRONTEND_RULES */
export function getCategoryVisualClass(category: ProductCategory | string): string {
  const norm = normalizeCategory(category)
  switch (norm) {
    case 'workflow':
      return 'visual-blue'
    case 'agentic':
      return 'visual-purple'
    case 'script':
      return 'visual-green'
    case 'code':
      return 'visual-orange'
    default:
      return 'visual-blue'
  }
}

/** Derive the extension from a stored file name. Missing names have no badge. */
export function getFileExtensionPill(fileName?: string | null): string {
  if (fileName) {
    const ext = fileName.split('.').pop()
    if (ext && ext !== fileName) {
      return `.${ext.toLowerCase()}`
    }
  }
  return ''
}
