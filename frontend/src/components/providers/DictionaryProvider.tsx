'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Dictionary } from '@/dictionaries'

// Loaded once per locale in the server layout and published here, so client
// components read translations without prop-drilling four levels deep.
const DictionaryContext = createContext<Dictionary | null>(null)

export function DictionaryProvider({
  dict,
  children,
}: {
  dict: Dictionary
  children: ReactNode
}) {
  return <DictionaryContext.Provider value={dict}>{children}</DictionaryContext.Provider>
}

export function useDictionary(): Dictionary {
  const dict = useContext(DictionaryContext)
  if (!dict) {
    throw new Error('useDictionary must be used within a DictionaryProvider')
  }
  return dict
}