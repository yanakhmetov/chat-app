'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import io, { Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (event: string, data: any) => void
  on: (event: string, callback: (...args: any[]) => void) => void
  off: (event: string, callback?: (...args: any[]) => void) => void
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated, user } = useAuth()

  const connect = useCallback(() => {
    const token = localStorage.getItem('token')

    if (!token || !isAuthenticated) {
      if (socket) {
        console.log('🔌 Disconnecting socket (no token or not authenticated)')
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    if (socket?.connected) return

    console.log('🔌 Connecting to socket with token...')
    const newSocket = io({
      path: '/api/socket',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id)
      setIsConnected(true)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      setIsConnected(false)
      if (reason === 'io client disconnect') {
        setSocket(null)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    setSocket(newSocket)
  }, [isAuthenticated, socket, isConnected])

  // Реагируем на изменение пользователя или флага авторизации
  useEffect(() => {
    connect()
  }, [isAuthenticated, user?.id])

  // Слушаем изменения в localStorage (на случай если AuthForm записала токен)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        console.log('🔌 Auth storage changed, re-connecting...')
        connect()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    // Также ловим событие в рамках этой же вкладки (т.к. StorageEvent только для других вкладок)
    const originalSetItem = localStorage.setItem
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value])
      if (key === 'token') {
        console.log('🔌 Token set manually, triggering connect')
        connect()
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      localStorage.setItem = originalSetItem
    }
  }, [connect])

  const emit = useCallback((event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      console.warn(`Socket not connected, cannot emit ${event}`)
    }
  }, [socket, isConnected])

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }, [socket])

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, callback)
    }
  }, [socket])

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
