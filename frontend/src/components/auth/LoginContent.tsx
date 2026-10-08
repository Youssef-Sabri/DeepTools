'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { GithubIcon } from '@/components/icons/SocialIcons'
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
  
  const { login, loading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const loggedUser = await login({ email, password })
      if (loggedUser?.role === 'admin') {
        router.push(`/${locale}/admin`)
      } else {
        router.push(`/${locale}/dashboard`)
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
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
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">{dict.auth.login.title}</h1>
            <p className="text-sm text-muted-foreground mt-2">{dict.auth.login.subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 text-sm rounded-xl bg-accent-rose/10 text-accent-rose border border-accent-rose/20">
              {error}
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
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{dict.auth.login.password}</label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full ps-11 pe-11 py-3 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-accent-cyan focus:ring-accent-cyan" />
                <span className="text-sm text-muted-foreground">{dict.auth.login.remember}</span>
              </label>
              <Link href={`/${locale}/auth/forgot-password`} className="text-sm text-accent-cyan hover:text-accent-violet transition-colors">
                {dict.auth.login.forgot}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : dict.auth.login.submit}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          {/* Social Login */}
          <button className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium border border-border rounded-xl hover:bg-muted/50 transition-all">
            <GithubIcon className="w-5 h-5" />
            Continue with GitHub
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {dict.auth.login.noAccount}{' '}
            <Link href={`/${locale}/auth/register`} className="text-accent-cyan hover:text-accent-violet font-medium transition-colors">
              {dict.auth.login.signUp}
            </Link>
          </p>
        </div>
      </motion.div>
    </section>
  )
}
