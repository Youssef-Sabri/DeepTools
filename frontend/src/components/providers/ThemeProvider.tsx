'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'

type Theme = 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const staticLightContext: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
    try {
      localStorage.setItem('theme', 'light')
    } catch {}
  }, [])

  return (
    <ThemeContext.Provider value={staticLightContext}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
