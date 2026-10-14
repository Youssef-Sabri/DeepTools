import { Loader2 } from 'lucide-react'

interface SectionLoaderProps {
  /** Localised label describing what is loading. */
  label: string
}

// Inline section loading state (was repeated six times in the admin console).
export function SectionLoader({ label }: SectionLoaderProps) {
  return (
    <div className="p-12 text-center text-xs text-[var(--muted)]">
      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--blue-bright)]" />
      {label}
    </div>
  )
}