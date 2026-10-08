'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchApi } from '@/lib/api'
import type { Dictionary } from '@/dictionaries'

interface ForgotPasswordContentProps {
  dict: Dictionary
  locale: string
}

export default function ForgotPasswordContent({ dict, locale }: ForgotPasswordContentProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setSuccess(res.message || dict.auth.forgotPassword?.success || 'Reset link sent!')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
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
            <Link href={`/${locale}/auth/login`} className="inline-flex items-center gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{dict.auth.forgotPassword?.title || 'Forgot Password?'}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {dict.auth.forgotPassword?.subtitle || 'Enter your email and we\'ll send you a reset link'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 text-sm rounded-xl bg-accent-rose/10 text-accent-rose border border-accent-rose/20">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 text-sm rounded-xl bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
              {success}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2">{dict.auth.login.email}</label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full ps-11 pe-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (dict.auth.forgotPassword?.submit || 'Send Reset Link')}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {dict.auth.login.noAccount || 'Don\'t have an account?'}{' '}
            <Link href={`/${locale}/auth/register`} className="text-accent-cyan hover:text-accent-violet font-medium transition-colors">
              {dict.auth.login.signUp || 'Sign Up'}
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link href={`/${locale}/auth/login`} className="text-accent-cyan hover:text-accent-violet font-medium transition-colors">
              ← {dict.auth.login.submit || 'Back to Login'}
            </Link>
          </p>
        </div>
      </motion.div>
    </section>
  )
}