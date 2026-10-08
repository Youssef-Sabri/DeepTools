'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Loader2, Shield } from 'lucide-react'
import { GithubIcon } from '@/components/icons/SocialIcons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Dictionary } from '@/dictionaries'

interface RegisterContentProps {
  dict: Dictionary
  locale: string
}

export default function RegisterContent({ dict, locale }: RegisterContentProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [error, setError] = useState<string | null>(null)

  const { register, loading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await register({ name, email, password, role })
      router.push(`/${locale}/dashboard`)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
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
            <h1 className="text-2xl font-bold">{dict.auth.register.title}</h1>
            <p className="text-sm text-muted-foreground mt-2">{dict.auth.register.subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 text-sm rounded-xl bg-accent-rose/10 text-accent-rose border border-accent-rose/20">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2">{dict.auth.register.name}</label>
              <div className="relative">
                <User className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full ps-11 pe-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{dict.auth.register.email}</label>
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
              <label className="block text-sm font-medium mb-2">{dict.auth.register.password}</label>
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
            <div>
              <label className="block text-sm font-medium mb-2">{dict.auth.register.confirmPassword}</label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full ps-11 pe-4 py-3 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{dict.auth.register.role}</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                  className="w-full ps-4 pe-10 py-3 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all appearance-none"
                >
                  <option value="user">{dict.auth.register.userRole}</option>
                  <option value="admin">{dict.auth.register.adminRole}</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" required className="w-4 h-4 rounded border-border text-accent-cyan focus:ring-accent-cyan mt-0.5" />
              <span className="text-sm text-muted-foreground">{dict.auth.register.terms}</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet hover:shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : dict.auth.register.submit}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium border border-border rounded-xl hover:bg-muted/50 transition-all">
            <GithubIcon className="w-5 h-5" />
            Continue with GitHub
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {dict.auth.register.hasAccount}{' '}
            <Link href={`/${locale}/auth/login`} className="text-accent-cyan hover:text-accent-violet font-medium transition-colors">
              {dict.auth.register.signIn}
            </Link>
          </p>
        </div>
      </motion.div>
    </section>
  )
}
