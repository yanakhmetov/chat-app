// src/components/chat/AddMembersModal.tsx
'use client'

import { useState, useEffect } from 'react'
import Button from '../ui/Button'

interface User {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  isOnline?: boolean
}

interface AddMembersModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  currentUserIds: string[]
  isAdmin: boolean
  onMembersAdded: () => void
}

export default function AddMembersModal({
  isOpen,
  onClose,
  conversationId,
  currentUserIds,
  isAdmin,
  onMembersAdded
}: AddMembersModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setSelectedUsers([])
      setUsers([])
    }
  }, [isOpen])

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
      
      // Фильтруем пользователей, которые уже в группе
      const availableUsers = data.users.filter(
        (user: User) => !currentUserIds.includes(user.id)
      )
      setUsers(availableUsers)
    } catch (error) {
      console.error('Error searching users:', error)
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

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return
    
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          addUsers: selectedUsers
        })
      })
      
      if (response.ok) {
        onMembersAdded()
        onClose()
      } else {
        const error = await response.json()
        console.error('Error adding members:', error)
        alert(error.error || 'Failed to add members')
      }
    } catch (error) {
      console.error('Error adding members:', error)
      alert('Failed to add members')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-in shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Добавить участников в группу
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {!isAdmin ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-4h12m-6-4v2m-6 4h12m-6 4h12" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Только администратор группы может добавлять участников</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Поиск пользователей по имени или email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  onClick={searchUsers}
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium shadow-sm"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Поиск'
                  )}
                </button>
              </div>
              
              {users.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {users.map(user => (
                    <div
                      key={user.id}
                      onClick={() => toggleUser(user.id)}
                      className={`flex items-center p-3 cursor-pointer rounded-xl transition-all ${
                        selectedUsers.includes(user.id) 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => {}}
                        className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.username}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      {user.isOnline && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchTerm && !loading && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">Пользователи не найдены</p>
                </div>
              )}
              
              {selectedUsers.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Выбрано: {selectedUsers.length} пользователь(ей)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedUsers.slice(0, 5).map(userId => {
                      const user = users.find(u => u.id === userId)
                      return user ? (
                        <span key={userId} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {user.username}
                        </span>
                      ) : null
                    })}
                    {selectedUsers.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                        +{selectedUsers.length - 5} ещё
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {isAdmin && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedUsers.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Добавление...
                </>
              ) : (
                `Добавить ${selectedUsers.length} участник${selectedUsers.length !== 1 ? 'ов' : ''}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}