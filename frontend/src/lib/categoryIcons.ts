import { Cpu, Layers, ShieldCheck, Sparkles, Terminal, type LucideIcon } from 'lucide-react'
import { normalizeCategory } from './utils'

// Single source for the icon/accent pairing per slug (was duplicated in three
// components). Only the visual is canonical -- category data stays dynamic
// (FRONTEND_RULES.md 2.8). Unknown slugs fall back to Layers.
const CATEGORY_VISUALS: Record<string, { icon: LucideIcon; accent: string }> = {
  workflow: { icon: Sparkles, accent: 'text-[var(--blue)]' },
  agentic: { icon: Cpu, accent: 'text-[var(--purple)]' },
  script: { icon: Terminal, accent: 'text-[var(--green)]' },
  code: { icon: ShieldCheck, accent: 'text-[var(--orange)]' },
}

const FALLBACK = { icon: Layers, accent: 'text-[var(--blue)]' } as const

export function getCategoryVisual(slug?: string | null): {
  icon: LucideIcon
  accent: string
} {
  return CATEGORY_VISUALS[normalizeCategory(slug)] ?? FALLBACK
}

export function getCategoryIcon(slug?: string | null): LucideIcon {
  return getCategoryVisual(slug).icon
}