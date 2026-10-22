import type { Dictionary } from '@/dictionaries'
import type { Category } from '@/lib/types'

export interface CategoryFilter {
  slug: string
  label: string
  productCount?: number
}

// A fresh database can contain legacy products before its category directory is
// populated. Keep their canonical slug filters available in that case. Once the
// API supplies categories, its active list and ordering are authoritative.
export function getCategoryFilters(
  categories: Category[],
  dict: Dictionary,
  isArabic: boolean,
): CategoryFilter[] {
  if (categories.length > 0) {
    return categories.map((category) => ({
      slug: category.slug,
      label: isArabic && category.nameAr ? category.nameAr : category.name,
      productCount: category.productCount,
    }))
  }

  return [
    { slug: 'workflow', label: dict.footer.workflows },
    { slug: 'script', label: dict.footer.scripts },
    { slug: 'agentic', label: dict.footer.agents },
    { slug: 'code', label: dict.footer.codeTemplates },
  ]
}
