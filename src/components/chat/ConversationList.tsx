// src/components/chat/ConversationList.tsx
'use client'

import { useState, useEffect } from 'react'
import ConversationItem from './ConversationItem'
import type { Conversation } from '@/types'
import { useSocket } from '@/hooks/useSocket'

interface ConversationListProps {
  conversations: Conversation[]
  onSelectConversation: (id: string) => void
  currentUserId: string
  selectedId?: string
}

export default function ConversationList({
  conversations,
  onSelectConversation,
  currentUserId,
  selectedId
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [localConversations, setLocalConversations] = useState(conversations)
  const { socket } = useSocket()

  // Обновляем локальные разговоры при изменении пропсов
  useEffect(() => {
    setLocalConversations(conversations)
  }, [conversations])

  // Слушаем обновления статуса
  useEffect(() => {
    if (!socket) return

    const handleUserOnline = ({ userId }: { userId: string }) => {
      console.log('ConversationList - user online:', userId)
      setLocalConversations(prev => prev.map(conv => ({
        ...conv,
        users: conv.users.map(u => 
          u.id === userId 
            ? { ...u, status: 'ONLINE', isOnline: true } 
            : u
        )
      })))
    }

    const handleUserOffline = ({ userId }: { userId: string }) => {
      console.log('ConversationList - user offline:', userId)
      setLocalConversations(prev => prev.map(conv => ({
        ...conv,
        users: conv.users.map(u => 
          u.id === userId 
            ? { ...u, status: 'OFFLINE', isOnline: false } 
            : u
        )
      })))
    }

    const handleUsersOnline = ({ userIds }: { userIds: string[] }) => {
      console.log('ConversationList - online users list:', userIds)
      setLocalConversations(prev => prev.map(conv => ({
        ...conv,
        users: conv.users.map(u => ({
          ...u,
          isOnline: userIds.includes(u.id),
          status: userIds.includes(u.id) ? 'ONLINE' : 'OFFLINE'
        }))
      })))
    }

    socket.on('user:online', handleUserOnline)
    socket.on('user:offline', handleUserOffline)
    socket.on('users:online', handleUsersOnline)

    return () => {
      socket.off('user:online', handleUserOnline)
      socket.off('user:offline', handleUserOffline)
      socket.off('users:online', handleUsersOnline)
    }
  }, [socket])

  const filteredConversations = localConversations.filter(conv => {
    if (!searchTerm) return true
    
    if (conv.isGroup) {
      return conv.name?.toLowerCase().includes(searchTerm.toLowerCase())
    }
    
    const otherUser = conv.users.find(u => u.id !== currentUserId)
    return otherUser?.username.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Search input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
            <input
              type="text"
              placeholder="Поиск бесед..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          <svg
            className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      
      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-3 text-sm">Пока нет бесед</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Нажмите кнопку ниже, чтобы начать новый чат</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredConversations.map(conversation => {
              const lastMessage = conversation.messages && conversation.messages.length > 0 
                ? conversation.messages[conversation.messages.length - 1]
                : undefined
              
              return (
                <ConversationItem
                  key={conversation.id}
                  id={conversation.id}
                  name={conversation.name}
                  isGroup={conversation.isGroup}
                  lastMessage={lastMessage}
                  users={conversation.users}
                  currentUserId={currentUserId}
                  isSelected={selectedId === conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                />
              )
            })}
          </div>
        )}
      </div>
      
      {/* New Chat Button -固定在底部 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setShowNewChatModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Начать новый чат
        </button>
      </div>
      
      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} />
      )}
    </div>
  )
}

// NewChatModal component
function NewChatModal({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)

  const searchUsers = async () => {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users?search=${searchTerm}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async () => {
    if (selectedUsers.length === 0) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          isGroup,
          name: isGroup ? groupName : undefined
        })
      })
      
      if (response.ok) {
        onClose()
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create conversation')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Failed to create conversation')
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl h-[85vh] max-h-[85vh] overflow-hidden animate-slide-in shadow-2xl flex flex-col">
        {/* Заголовок */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Начать новый чат</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Контент - скроллится */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Group Chat Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div>
              <span className="text-base font-medium text-gray-700 dark:text-gray-300">Групповой чат</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Создать групповой чат с несколькими участниками</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isGroup}
                onChange={(e) => setIsGroup(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {/* Group Name Input */}
          {isGroup && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Название группы
              </label>
              <input
                type="text"
                placeholder="Введите название группы..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
                autoFocus
              />
            </div>
          )}
          
          {/* Search Users */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Поиск пользователей
            </label>
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base"
            />
            
            <button
              onClick={searchUsers}
              disabled={loading || !searchTerm.trim()}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Поиск...
                </div>
              ) : (
              'Найти пользователей'
              )}
            </button>
          </div>
          
          {/* Users List - исправлен горизонтальный скролл */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Выберите пользователей
              </label>
              {selectedUsers.length > 0 && (
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  выбрано: {selectedUsers.length}
                </span>
              )}
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              {users.length > 0 ? (
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {users.map(user => (
                    <div
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`flex items-center p-3 cursor-pointer transition-all ${
                        selectedUsers.includes(user.id) 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => {}}
                        className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.username}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {user.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      {user.isOnline && (
                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 hidden sm:inline">В сети</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchTerm && !loading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">Пользователи не найдены</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Попробуйте другой поисковый запрос</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">Найдите пользователей, чтобы начать чат</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Введите имя или email выше и нажмите "Найти пользователей"</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer с кнопками */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Отмена
          </button>
          <button
            onClick={createConversation}
            disabled={loading || selectedUsers.length === 0 || (isGroup && !groupName)}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Создание...
              </>
            ) : (
              `${isGroup ? 'Создать группу' : 'Создать чат'}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}