'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { fetchApi } from '@/lib/api'
import { useDictionary } from '@/components/providers/DictionaryProvider'

interface ForgotPasswordContentProps {
  locale: string
}

export default function ForgotPasswordContent({ locale }: ForgotPasswordContentProps) {
  const dict = useDictionary()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetchApi<{ message?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setSuccess(
        res.message ||
        (dict.auth.forgotPassword.linkDispatched)
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center py-16 px-4 blueprint-grid">
      <div className="ambient-glow-blue top-[20%] start-[20%]" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md deeptools-card rounded-2xl p-8 sm:p-10 border border-[var(--line-bright)] shadow-2xl z-10"
      >
        <div className="text-center mb-8">
          <Link href={`/${locale}/auth/login`} className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)] mb-4">
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{dict.auth.forgotPassword.backToSignIn}</span>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {dict.auth.forgotPassword.recoverAccountPassword}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5">
            {dict.auth.forgotPassword.emailHint}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-[var(--rose)]/15 border border-[var(--rose)]/30 text-xs text-[var(--rose)] font-mono">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 rounded-xl bg-[var(--green)]/15 border border-[var(--green)]/30 text-xs text-[var(--green)] font-mono flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1.5">
              {dict.auth.forgotPassword.emailAddress}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--muted-2)] absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue-bright)] font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 mt-6"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{dict.auth.forgotPassword.submit}</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
