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
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: AuthCredentials) => Promise<User>
  register: (credentials: RegisterCredentials) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' })
    } catch {
      window.alert('Could not sign out. Please retry.')
      return
    }
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const profile = await fetchApi<User>('/users/me')
      setUser(profile)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      localStorage.removeItem('token')
      try {
        const profile = await fetchApi<User>('/users/me')
        if (isMounted) setUser(profile)
      } catch { if (isMounted) setUser(null) }
      if (isMounted) setLoading(false)
    }

    initAuth()

    const handleUnauthorized = () => {
      setUser(null)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)

    return () => {
      isMounted = false
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  const login = async (credentials: AuthCredentials): Promise<User> => {
    setLoading(true)
    try {
      const data = await fetchApi<AuthResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
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
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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
