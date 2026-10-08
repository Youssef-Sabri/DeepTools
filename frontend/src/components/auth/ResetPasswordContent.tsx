'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchApi } from '@/lib/api'
import type { Dictionary } from '@/dictionaries'

interface ResetPasswordContentProps {
  dict: Dictionary
  locale: string
}

export default function ResetPasswordContent({ dict, locale }: ResetPasswordContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError(dict.auth.resetPassword?.invalidToken || 'Invalid reset token')
      setTokenValid(false)
    } else {
      setTokenValid(true)
    }
  }, [token, dict])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError(dict.auth.resetPassword?.invalidToken || 'Invalid reset token')
      return
    }

    if (password !== confirmPassword) {
      setError(dict.auth.resetPassword?.passwordsMismatch || 'Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError(dict.auth.resetPassword?.shortPassword || 'Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setSuccess(dict.auth.resetPassword?.success || 'Password has been reset successfully')
      setTimeout(() => router.push(`/${locale}/auth/login`), 2000)
    } catch (err: any) {
      setError(err.message || dict.auth.resetPassword?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!tokenValid) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-accent-rose/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-accent-rose" />
          </div>
          <h1 className="text-xl font-bold mb-2">{dict.auth.resetPassword?.invalidTitle || 'Invalid Reset Link'}</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <a href={`/${locale}/auth/forgot-password`} className="text-accent-cyan hover:text-accent-violet font-medium">
            {dict.auth.resetPassword?.requestNew || 'Request a new link'}
          </a>
        </motion.div>
      </section>
    )
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className="absolute inset-0 dot-pattern opacity-10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="p-8 md:p-10 rounded-2xl glass border border-border">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{dict.auth.resetPassword?.title || 'Reset Password'}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {dict.auth.resetPassword?.subtitle || 'Enter your new password below'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 text-sm rounded-xl bg-accent-rose/10 text-accent-rose border border-accent-rose/20">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2">{dict.auth.resetPassword?.newPassword || 'New Password'}</label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full ps-11 pe-12 py-3 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{dict.auth.resetPassword?.confirmPassword || 'Confirm Password'}</label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full ps-11 pe-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (dict.auth.resetPassword?.submit || 'Reset Password')}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            <a href={`/${locale}/auth/login`} className="text-accent-cyan hover:text-accent-violet font-medium transition-colors">
              ← {dict.auth.resetPassword?.backToLogin || 'Back to Login'}
            </a>
          </p>
        </div>
      </motion.div>
    </section>
  )
}