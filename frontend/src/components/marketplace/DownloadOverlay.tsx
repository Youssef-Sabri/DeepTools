'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Download, CheckCircle2, X } from 'lucide-react'

interface DownloadOverlayProps {
  isVisible: boolean
  fileName: string
  progress: number // 0 to 100
  isComplete: boolean
  onClose: () => void
  locale?: string
}

export function DownloadOverlay({
  isVisible,
  fileName,
  progress,
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
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isComplete ? 'bg-[var(--green)]/20 text-[var(--green)]' : 'bg-[var(--blue)]/20 text-[var(--blue-bright)]'
            }`}>
              {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4 animate-bounce" />}
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text)] line-clamp-1">
                {fileName}
              </div>
              <div className="text-[10px] font-mono text-[var(--muted-2)]">
                {isComplete
                  ? (isAr ? 'اكتمل التنزيل بنجاح' : 'Download Complete')
                  : (isAr ? `جارٍ النقل... ${progress}%` : `Transferring stream... ${progress}%`)}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
          <motion.div
            className={`h-full ${isComplete ? 'bg-[var(--green)]' : 'bg-[var(--blue)]'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
