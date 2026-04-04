'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import ConversationList, { NewChatModal } from '@/components/chat/ConversationList'
import UserProfileModal from '@/components/profile/UserProfileModal'
import { useSocket } from '@/hooks/useSocket'
import type { Conversation, AuthUser } from '@/types'

export default function ConversationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    fetchConversations()
    
    if (searchParams.get('sidebar') === 'open') {
      setIsSidebarOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!socket) return
    
    const handleNewMessage = () => {
      fetchConversations()
    }

    const handleConversationUpdated = (updatedConv: Conversation) => {
      setConversations(prev => prev.map(c => 
        c.id === updatedConv.id ? { ...updatedConv, messages: c.messages } : c
      ))
    }

    const handleConversationRemoved = ({ conversationId }: { conversationId: string }) => {
      setConversations(prev => prev.filter(c => c.id !== conversationId))
    }

    const handleConversationNew = (newConv: Conversation) => {
      setConversations(prev => {
        if (prev.some(c => c.id === newConv.id)) return prev
        return [newConv, ...prev]
      })
    }

    const handleUserOnline = ({ userId }: { userId: string }) => {
      setConversations(prev => prev.map(conv => ({
        ...conv,
        users: conv.users.map(u =>
          u.id === userId ? { ...u, status: 'ONLINE', isOnline: true } : u
        )
      })))
    }

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setConversations(prev => prev.map(conv => ({
        ...conv,
        users: conv.users.map(u =>
          u.id === userId ? { ...u, status: 'OFFLINE', isOnline: false } : u
        )
      })))
    }

    const handleUsersOnline = ({ userIds }: { userIds: string[] }) => {
      setConversations(prev => prev.map(conv => ({
        ...conv,
        users: conv.users.map(u => ({
          ...u,
          isOnline: userIds.includes(u.id),
          status: userIds.includes(u.id) ? 'ONLINE' : 'OFFLINE'
        }))
      })))
    }

    socket.on('message:new', handleNewMessage)
    socket.on('conversation:new', handleConversationNew)
    socket.on('conversation:updated', handleConversationUpdated)
    socket.on('conversation:removed', handleConversationRemoved)
    socket.on('user:online', handleUserOnline)
    socket.on('user:offline', handleUserOffline)
    socket.on('users:online', handleUsersOnline)
    
    // Запрашиваем актуальные статусы
    socket.emit('request:users_online')
    
    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('conversation:new', handleConversationNew)
      socket.off('conversation:updated', handleConversationUpdated)
      socket.off('conversation:removed', handleConversationRemoved)
      socket.off('user:online', handleUserOnline)
      socket.off('user:offline', handleUserOffline)
      socket.off('users:online', handleUsersOnline)
    }
  }, [socket])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/conversations/${conversationId}`)
  }

  const handleLogout = async () => {
    try {
      // Disconnect socket BEFORE removing token so server knows who is disconnecting
      if (socket) {
        socket.disconnect()
      }

      // Optional: Call logout API if needed
      await fetch('/api/auth/logout', { method: 'POST' })

      localStorage.removeItem('token')
      localStorage.removeItem('user')
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }

  const [showNewChatModal, setShowNewChatModal] = useState(false)

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar>
        <div className="p-4 text-gray-500 dark:text-gray-400">Загрузка диалогов...</div>
        </Sidebar>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Загрузка...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => {
          setIsSidebarOpen(false)
          setShowNewChatModal(false)
        }} 
        hideToggle={showNewChatModal}
      >
        <Header 
          user={user}
          onLogout={handleLogout}
          isConnected={isConnected}
          onProfileClick={() => {
            if (user) setSelectedProfileId(user.id)
          }}
        />
        <ConversationList
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          currentUserId={user?.id || ''}
          onOpenNewChat={() => setShowNewChatModal(true)}
        />
        {showNewChatModal && (
          <NewChatModal onClose={() => setShowNewChatModal(false)} />
        )}
      </Sidebar>
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Добро пожаловать в ChatApp
          </h2>
          <p className="text-gray-500 dark:text-gray-500">
            Выберите диалог, чтобы начать общение
          </p>
        </div>
      </div>

      {selectedProfileId && (
        <UserProfileModal
          userId={selectedProfileId}
          currentUserId={user?.id || ''}
          onClose={() => setSelectedProfileId(null)}
          onProfileUpdated={(updatedUser) => {
            if (updatedUser.id === user?.id) {
              const merged = { ...user, ...updatedUser }
              setUser(merged as AuthUser)
              localStorage.setItem('user', JSON.stringify(merged))
            }
          }}
        />
      )}
    </div>
  )
}