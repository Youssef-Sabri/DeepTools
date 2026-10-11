'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { fetchApi } from '@/lib/api'
import type { User } from '@/lib/types'

interface AuthCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  password: string
  name: string
}

interface AuthResponseData {
  user: User
  token: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (credentials: AuthCredentials) => Promise<User>
  register: (credentials: RegisterCredentials) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!storedToken) {
      setUser(null)
      setToken(null)
      return
    }
    try {
      const profile = await fetchApi<User>('/users/me', { token: storedToken })
      setUser(profile)
      setToken(storedToken)
    } catch {
      logout()
    }
  }, [logout])

  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        setToken(storedToken)
        try {
          const profile = await fetchApi<User>('/users/me', { token: storedToken })
          if (isMounted) setUser(profile)
        } catch {
          if (isMounted) {
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
          }
        }
      }
      if (isMounted) setLoading(false)
    }

    initAuth()

    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      isMounted = false
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [logout])

  const login = async (credentials: AuthCredentials): Promise<User> => {
    setLoading(true)
    try {
      const data = await fetchApi<AuthResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials): Promise<User> => {
    setLoading(true)
    try {
      const data = await fetchApi<AuthResponseData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
