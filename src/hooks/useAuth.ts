// src/hooks/useAuth.ts
'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuthLogic } from './useAuthLogic'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

// Создаем контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Хук для использования контекста
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Провайдер
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthLogic()
  
  return React.createElement(
    AuthContext.Provider,
    { value: auth },
    children
  )
}