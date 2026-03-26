// src/hooks/useSocket.ts
'use client'

import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    console.log('Socket hook - token exists:', !!token)
    
    if (!token) {
      console.log('No token, skipping socket connection')
      return
    }

    console.log('Creating socket connection...')
    
    const socket = io({
      path: '/api/socket',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully! ID:', socket.id)
      setIsConnected(true)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message)
      setIsConnected(false)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('user:online', (data) => {
      console.log('📡 User online event:', data)
    })

    socket.on('user:offline', (data) => {
      console.log('📡 User offline event:', data)
    })

    socket.on('users:online', (data) => {
      console.log('📡 Users online event:', data)
    })

    return () => {
      console.log('Cleaning up socket')
      socket.disconnect()
    }
  }, [])

  const emit = (event: string, data: any) => {
    if (socketRef.current && isConnected) {
      console.log(`📤 Emitting ${event}:`, data)
      socketRef.current.emit(event, data)
    } else {
      console.warn(`Cannot emit ${event}, socket not connected`)
    }
  }

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback)
    }
  }

  return { socket: socketRef.current, isConnected, emit, on, off }
}