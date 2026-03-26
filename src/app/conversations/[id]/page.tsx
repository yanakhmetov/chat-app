// src/app/conversations/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import ConversationList from '@/components/chat/ConversationList'
import ChatWindow from '@/components/chat/ChatWindow'
import { useSocket } from '@/hooks/useSocket'
import type { Conversation, AuthUser, Message } from '@/types'
import AddMembersModal from '@/components/chat/AddMembersModal'
import GroupSettings from '@/components/chat/GroupSettings'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [showGroupSettings, setShowGroupSettings] = useState(false)
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
    fetchCurrentConversation()
  }, [conversationId])

  useEffect(() => {
    if (!socket) return
    
    const handleNewMessage = (message: Message) => {
      fetchConversations()
      if (message.conversationId === conversationId) {
        fetchCurrentConversation()
      }
    }
    
    const handleUserOnline = ({ userId }: { userId: string }) => {
      setCurrentConversation((prev: any) => {
        if (!prev) return prev
        const updatedUsers = prev.users.map((user: any) => 
          user.id === userId ? { ...user, status: 'ONLINE', isOnline: true } : user
        )
        return { ...prev, users: updatedUsers }
      })
      
      setConversations(prev => prev.map(conv => ({
        ...conv,
        users: conv.users.map(u => 
          u.id === userId ? { ...u, status: 'ONLINE', isOnline: true } : u
        )
      })))
    }
    
    const handleUserOffline = ({ userId }: { userId: string }) => {
      setCurrentConversation((prev: any) => {
        if (!prev) return prev
        const updatedUsers = prev.users.map((user: any) => 
          user.id === userId ? { ...user, status: 'OFFLINE', isOnline: false } : user
        )
        return { ...prev, users: updatedUsers }
      })
      
      setConversations(prev => prev.map(conv => ({
        ...conv,
        users: conv.users.map(u => 
          u.id === userId ? { ...u, status: 'OFFLINE', isOnline: false } : u
        )
      })))
    }
    
    const handleUsersOnline = ({ userIds }: { userIds: string[] }) => {
      setCurrentConversation((prev: any) => {
        if (!prev) return prev
        const updatedUsers = prev.users.map((user: any) => ({
          ...user,
          isOnline: userIds.includes(user.id),
          status: userIds.includes(user.id) ? 'ONLINE' : 'OFFLINE'
        }))
        return { ...prev, users: updatedUsers }
      })
      
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
    socket.on('user:online', handleUserOnline)
    socket.on('user:offline', handleUserOffline)
    socket.on('users:online', handleUsersOnline)
    
    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('user:online', handleUserOnline)
      socket.off('user:offline', handleUserOffline)
      socket.off('users:online', handleUsersOnline)
    }
  }, [socket, conversationId])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      const formattedConversations: Conversation[] = data.map((conv: any) => ({
        id: conv.id,
        name: conv.name,
        isGroup: conv.isGroup,
        adminId: conv.adminId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        users: conv.users,
        messages: conv.messages || [],
        lastMessage: conv.messages?.[0]
      }))
      
      setConversations(formattedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchCurrentConversation = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Conversation not found')
      }
      
      const data = await response.json()
      
      const formattedConversation: Conversation = {
        id: data.id,
        name: data.name,
        isGroup: data.isGroup,
        adminId: data.adminId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        users: data.users,
        messages: data.messages || [],
        lastMessage: data.messages?.[0]
      }
      
      setCurrentConversation(formattedConversation)
    } catch (error) {
      console.error('Error fetching conversation:', error)
      router.push('/conversations')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (id: string) => {
    router.push(`/conversations/${id}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/login')
  }

  const handleMembersChanged = () => {
    fetchCurrentConversation()
    fetchConversations()
  }

  const handleGroupUpdated = () => {
    fetchCurrentConversation()
    fetchConversations()
    setShowGroupSettings(false)
  }

  const getConversationName = () => {
    if (!currentConversation || !user) return 'Chat'
    
    if (currentConversation.isGroup) {
      return currentConversation.name || 'Group Chat'
    }
    
    const otherUser = currentConversation.users.find(u => u.id !== user.id)
    return otherUser?.username || 'Unknown User'
  }

  const getOtherUserStatus = () => {
    if (!currentConversation || !user || currentConversation.isGroup) return null
    
    const otherUser = currentConversation.users.find(u => u.id !== user.id)
    const isOnline = otherUser?.status === 'ONLINE' || otherUser?.isOnline
    return isOnline ? 'Online' : 'Offline'
  }

  const isAdmin = currentConversation?.adminId === user?.id

  if (loading) {
    return (
      <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Sidebar>
          <div className="p-4 text-gray-500 dark:text-gray-400">Loading...</div>
        </Sidebar>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading conversation...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-screen flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Sidebar>
          <Header 
            user={user}
            onLogout={handleLogout}
            isConnected={isConnected}
          />
          <ConversationList
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            currentUserId={user?.id || ''}
            selectedId={conversationId}
          />
        </Sidebar>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with chat info and group actions */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getConversationName()}
                </h2>
                {!currentConversation?.isGroup && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {getOtherUserStatus()}
                  </p>
                )}
                {currentConversation?.isGroup && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {currentConversation.users.length} members
                    {isAdmin && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              {/* Group action buttons */}
              {currentConversation?.isGroup && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Add Members"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Add Members</span>
                  </button>
                  <button
                    onClick={() => setShowGroupSettings(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Group Settings"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                </div>
              )}
              
              {/* Non-group chat doesn't have action buttons */}
              {!currentConversation?.isGroup && (
                <div className="w-20"></div> // Spacer for alignment
              )}
            </div>
          </div>
          
          <ChatWindow
            conversationId={conversationId}
            currentUserId={user?.id || ''}
            isGroup={currentConversation?.isGroup || false}
            currentUserIds={currentConversation?.users.map(u => u.id) || []}
            users={currentConversation?.users || []}
            groupName={currentConversation?.name || ''}
            groupAdminId={currentConversation?.adminId || ''}
            onMembersChanged={handleMembersChanged}
            onGroupUpdated={handleGroupUpdated}
          />
        </div>
      </div>
      
      {/* Modals */}
      <AddMembersModal
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        conversationId={conversationId}
        currentUserIds={currentConversation?.users.map(u => u.id) || []}
        isAdmin={isAdmin}
        onMembersAdded={handleMembersChanged}
      />
      
      <GroupSettings
        isOpen={showGroupSettings}
        onClose={() => setShowGroupSettings(false)}
        conversationId={conversationId}
        conversationName={currentConversation?.name || ''}
        users={currentConversation?.users || []}
        currentUserId={user?.id || ''}
        adminId={currentConversation?.adminId || ''}
        onGroupUpdated={handleGroupUpdated}
      />
    </>
  )
}