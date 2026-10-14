'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getPasswordValidationError } from '@/lib/passwordValidation'
import type { Dictionary } from '@/dictionaries'

interface RegisterContentProps {
  dict: Dictionary
  locale: string
}

export default function RegisterContent({ dict, locale }: RegisterContentProps) {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  const isGuestUpgrade = searchParams.get('guest_upgrade') === 'true' || Boolean(emailParam)

  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register } = useAuth()
  const router = useRouter()
  const isAr = locale === 'ar'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPasswordError(null)

    const validationError = getPasswordValidationError(password, isAr)
    if (validationError) {
      setPasswordError(validationError)
      return
    }

    if (password !== confirmPassword) {
      setError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
      return
    }

    setSubmitting(true)

    try {
      await register({ name, email, password })
      router.push(`/${locale}/dashboard`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isAr ? 'فشل إنشاء الحساب' : 'Registration failed')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center py-16 px-4 blueprint-grid">
      <div className="ambient-glow-purple top-[20%] end-[25%]" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md deeptools-card rounded-2xl p-8 sm:p-10 border border-[var(--line-bright)] shadow-2xl z-10"
      >
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--line-bright)] flex items-center justify-center font-mono font-bold text-sm text-[var(--blue-bright)]">
              DT
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            {dict.auth.register.title}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1.5">
            {dict.auth.register.subtitle}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-[var(--rose)]/15 border border-[var(--rose)]/30 text-xs text-[var(--rose)] font-mono">
            {error}
          </div>
        )}

        {isGuestUpgrade && (
          <div className="mb-6 p-3.5 rounded-xl bg-[var(--blue)]/10 border border-[var(--blue-bright)]/30 text-xs text-[var(--blue-bright)] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[var(--blue-bright)]" />
            <div>
              <p className="font-semibold text-[var(--text)]">
                {isAr ? 'ربط مشتريات الزائر تلقائياً' : 'Automatic Purchase Linking'}
              </p>
              <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                {isAr
                  ? 'عند إتمام التسجيل بهذا البريد، ستُنقل جميع ملفاتك وتراخيصك السابقة كزائر تلقائياً وبأمان إلى لوحة التحكم الخاصة بك.'
                  : 'Registering with this email will automatically and permanently link all your previous guest downloads and licenses to your account dashboard.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1.5">
              {dict.auth.register.name}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[var(--muted-2)] absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue-bright)] font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1.5">
              {dict.auth.register.email}
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

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1.5">
              {dict.auth.register.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--muted-2)] absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError(null)
                }}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'signup-password-error' : undefined}
                placeholder="••••••••••••"
                className="w-full ps-10 pe-10 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue-bright)] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] hover:text-[var(--text)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p id="signup-password-error" role="alert" className="mt-1.5 text-xs text-[var(--rose)]">
                {passwordError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[var(--muted-2)] mb-1.5">
              {dict.auth.register.confirmPassword}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--muted-2)] absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full ps-10 pe-10 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs text-[var(--text)] focus:outline-none focus:border-[var(--blue-bright)] font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[var(--blue)] hover:bg-[var(--blue-bright)] text-white flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 mt-6"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{dict.auth.register.submit}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--line)] text-center text-xs text-[var(--muted)]">
          <span>{dict.auth.register.hasAccount} </span>
          <Link
            href={`/${locale}/auth/login`}
            className="font-semibold text-[var(--blue-bright)] hover:underline"
          >
            {dict.auth.register.signIn}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
