'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Dictionary } from '@/dictionaries'

interface LoginContentProps {
  dict: Dictionary
  locale: string
}

export default function LoginContent({ dict, locale }: LoginContentProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const loggedUser = await login({ email, password })
      if (loggedUser?.role?.toUpperCase() === 'ADMIN') {
        router.push(`/${locale}/admin`)
      } else {
        const next = new URLSearchParams(window.location.search).get('next')
        const allowedDestination = next && new RegExp(`^/${locale}/dashboard(?:\\?tab=(?:purchases|upload|uploads|sales|profile))?$`).test(next)
        router.push(allowedDestination ? next : `/${locale}/dashboard`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (dict.auth.login.invalidEmailOrPassword)
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page auth-page-clean relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950 py-16 px-4">
      <div aria-hidden="true" className="auth-card-glow" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-panel relative z-10 w-full max-w-md rounded-2xl border border-slate-800/50 p-8 sm:p-10"
      >
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--line-bright)] flex items-center justify-center font-mono font-bold text-sm text-[var(--blue-bright)]">
              DT
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {dict.auth.login.title}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5">
            {dict.auth.login.subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-[var(--rose)]/15 border border-[var(--rose)]/30 text-xs text-[var(--rose)] font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1.5">
              {dict.common.emailAddress}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--muted-2)] absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-bright)] focus:border-[var(--blue-bright)] font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase text-[var(--muted-2)]">
                {dict.common.password}
              </label>
              <Link
                href={`/${locale}/auth/forgot-password`}
                className="text-[11px] text-[var(--blue-bright)] hover:underline"
              >
                {dict.auth.login.forgot}
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--muted-2)] absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[var(--blue)] hover:bg-[var(--blue-hover)] text-white flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 mt-6"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{dict.auth.login.submit}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
          <span>{dict.auth.login.noAccount} </span>
          <Link
            href={`/${locale}/auth/register`}
            className="font-semibold text-[var(--blue-bright)] hover:underline"
          >
            {dict.auth.login.signUp}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
