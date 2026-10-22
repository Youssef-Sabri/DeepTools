'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchApi } from '@/lib/api'
import { getPasswordValidationError } from '@/lib/passwordValidation'
import type { Dictionary } from '@/dictionaries'

interface ResetPasswordContentProps {
  dict: Dictionary
  locale: string
}

export default function ResetPasswordContent({ dict, locale }: ResetPasswordContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const hasToken = Boolean(token)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const t = dict.auth.resetPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError(t.invalidToken)
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t.passwordsMismatch)
      return
    }

    const passwordError = getPasswordValidationError(newPassword, dict)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)

    try {
      await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      })
      setSuccess(t.success)
      setTimeout(() => router.push(`/${locale}/auth/login`), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.error
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!hasToken) {
    return (
      <div className="auth-page min-h-[80vh] flex items-center justify-center py-16 px-4 blueprint-grid">
        <div className="deeptools-card rounded-2xl p-8 max-w-md w-full text-center border border-[var(--rose)]/30">
          <div className="w-12 h-12 rounded-full bg-[var(--rose)]/15 text-[var(--rose)] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text)]">
            {t.invalidTitle}
          </h2>
          <p className="text-xs text-[var(--muted)] mt-2">
            {t.invalidToken}
          </p>
          <Link
            href={`/${locale}/auth/forgot-password`}
            className="mt-6 inline-block px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--line)] hover:bg-[var(--surface-3)]"
          >
            {t.requestNew}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page relative min-h-[85vh] flex items-center justify-center py-16 px-4 blueprint-grid">
      <div className="ambient-glow-purple top-[20%] start-[20%]" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-panel relative w-full max-w-md deeptools-card rounded-2xl p-8 sm:p-10 border border-[var(--line-bright)] z-10"
      >
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] border border-[var(--line-bright)] flex items-center justify-center mx-auto mb-4 font-mono font-bold text-sm text-[var(--blue-bright)]">
            DT
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {t.title}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5">
            {t.subtitle}
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
              {t.newPassword}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--muted-2)] absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full ps-10 pe-10 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-bright)] focus:border-[var(--blue-bright)] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] hover:text-[var(--text)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1.5">
              {dict.common.confirmPassword}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--muted-2)] absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full ps-10 pe-10 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-bright)] focus:border-[var(--blue-bright)] font-mono"
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
              <>
                <span>{dict.common.resetPassword}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
