'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { fetchApi } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (credentials: any) => Promise<User>
  register: (data: any) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        setToken(storedToken)
        try {
          const profile = await fetchApi('/auth/me')
          setUser(profile)
        } catch (error) {
          console.error('Failed to load user profile, logging out...', error)
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const login = async (credentials: any) => {
    setLoading(true)
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      localStorage.setItem('token', data.accessToken)
      setToken(data.accessToken)
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const register = async (registerData: any) => {
    setLoading(true)
    try {
      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerData),
      })
      localStorage.setItem('token', data.accessToken)
      setToken(data.accessToken)
      setUser(data.user)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
