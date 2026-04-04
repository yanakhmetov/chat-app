
'use client'

import { useEffect, useState, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

interface Message {
  id: string
  content: string
  senderId: string
  conversationId: string
  readBy: string[]
  createdAt: string
  sender: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

interface User {
  id: string
  username: string
  avatarUrl: string | null
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  isGroup?: boolean
  currentUserIds?: string[]
  users?: User[]
  groupName?: string
  groupAdminId?: string
  onMembersChanged?: () => void
  onGroupUpdated?: () => void
  onUserClick?: (userId: string) => void
}

export default function ChatWindow({ 
  conversationId, 
  currentUserId, 
  isGroup = false,
  users = [],
  onMembersChanged,
  onGroupUpdated,
  onUserClick
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const { socket, emit, on, off } = useSocket()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
  }, [conversationId])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message])
      }
    }

    const handleTypingStart = ({ conversationId: convId, userId }: any) => {
      if (convId === conversationId && userId !== currentUserId) {
        setTypingUsers(prev => new Set(prev).add(userId))
      }
    }

    const handleTypingStop = ({ conversationId: convId, userId }: any) => {
      if (convId === conversationId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      }
    }

    const handleMessageUpdated = (updatedMessage: Message) => {
      if (updatedMessage.conversationId === conversationId) {
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ))
      }
    }

    on('message:new', handleNewMessage)
    on('message:updated', handleMessageUpdated)
    on('typing:start', handleTypingStart)
    on('typing:stop', handleTypingStop)

    return () => {
      off('message:new', handleNewMessage)
      off('message:updated', handleMessageUpdated)
      off('typing:start', handleTypingStart)
      off('typing:stop', handleTypingStop)
    }
  }, [socket, conversationId, currentUserId, on, off])

  useEffect(() => {
    if (!socket || messages.length === 0) return

    const unreadMessageIds = messages
      .filter(msg => msg.senderId !== currentUserId && !msg.readBy.includes(currentUserId))
      .map(msg => msg.id)

    if (unreadMessageIds.length > 0) {
      emit('messages:mark-as-read', {
        conversationId,
        messageIds: unreadMessageIds
      })
    }
  }, [messages, socket, currentUserId, conversationId, emit])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = (content: string) => {
    if (!content.trim() || !socket) return
    
    emit('message:send', {
      conversationId,
      content: content.trim()
    })
  }

  const handleTyping = (isTyping: boolean) => {
    if (!socket) return
    
    if (isTyping) {
      emit('typing:start', { conversationId })
    } else {
      emit('typing:stop', { conversationId })
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Загрузка сообщений...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          typingUsers={typingUsers}
          isGroup={isGroup}
          onUserClick={onUserClick}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={sendMessage} onTyping={handleTyping} />
    </div>
  )
}