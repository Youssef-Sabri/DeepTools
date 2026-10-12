'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Download, CheckCircle2, X } from 'lucide-react'

interface DownloadOverlayProps {
  isVisible: boolean
  fileName: string
  progress: number // kept for callers; the browser manages transfer progress
  isComplete: boolean
  onClose: () => void
  locale?: string
}

export function DownloadOverlay({
  isVisible,
  fileName,
  isComplete,
  onClose,
  locale = 'en',
}: DownloadOverlayProps) {
  if (!isVisible) return null

  const isAr = locale === 'ar'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 end-6 z-50 w-80 p-4 rounded-xl bg-[var(--surface)] border border-[var(--line-bright)] shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isComplete ? 'bg-[var(--green)]/20 text-[var(--green)]' : 'bg-[var(--blue)]/20 text-[var(--blue-bright)]'
            }`}>
              {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4 animate-bounce" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text)] line-clamp-1">{fileName}</div>
              <div className="text-[10px] font-mono text-[var(--muted-2)]">
                {isComplete
                  ? (isAr ? 'بدأ التنزيل في متصفحك' : 'Download started in your browser')
                  : (isAr ? 'جارٍ تجهيز التنزيل...' : 'Preparing download...')}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
