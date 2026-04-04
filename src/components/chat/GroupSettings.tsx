
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageModal from '../ui/ImageModal'


interface User {
  id: string
  username: string
  avatarUrl: string | null
}

interface GroupSettingsProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  conversationName: string
  users: User[]
  currentUserId: string
  adminId: string
  onGroupUpdated: () => void
  onUserClick?: (userId: string) => void
}

export default function GroupSettings({
  isOpen,
  onClose,
  conversationId,
  conversationName,
  users,
  currentUserId,
  adminId,
  onGroupUpdated,
  onUserClick
}: GroupSettingsProps) {
  const router = useRouter()
  const [groupName, setGroupName] = useState(conversationName)
  const [isEditingName, setIsEditingName] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedNewAdmin, setSelectedNewAdmin] = useState('')
  const [enlargedImage, setEnlargedImage] = useState<{ src: string, alt: string } | null>(null)

  
  const isAdmin = currentUserId === adminId

  const updateGroupName = async () => {
    if (!groupName.trim() || groupName === conversationName) {
      setIsEditingName(false)
      return
    }
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: groupName })
      })
      
      if (response.ok) {
        onGroupUpdated()
        setIsEditingName(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update group name')
      }
    } catch (error) {
      console.error('Error updating group name:', error)
      alert('Failed to update group name')
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого участника?')) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ removeUsers: [userId] })
      })
      
      if (response.ok) {
        onGroupUpdated()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  const leaveGroup = async () => {
    if (!confirm('Вы уверены, что хотите покинуть эту группу?')) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ removeUsers: [currentUserId] })
      })
      
      if (response.ok) {
        onClose()
        router.push('/conversations')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to leave group')
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      alert('Failed to leave group')
    } finally {
      setLoading(false)
    }
  }

  const deleteGroup = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить.')) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        onClose()
        router.push('/conversations')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete group')
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      alert('Failed to delete group')
    } finally {
      setLoading(false)
    }
  }

  const transferAdmin = async () => {
    if (!selectedNewAdmin) return
    
    if (!confirm('Вы уверены, что хотите передать владение? Вы будете удалены из группы.')) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          transferAdmin: selectedNewAdmin,
          removeUsers: [currentUserId] 
        })
      })
      
      if (response.ok) {
        setShowTransferModal(false)
        onClose()
        router.push('/conversations')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to transfer ownership')
      }
    } catch (error) {
      console.error('Error transferring admin:', error)
      alert('Failed to transfer ownership')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-in shadow-2xl">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Настройки группы</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Название группы
              </label>
              {isEditingName && isAdmin ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    onClick={updateGroupName}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false)
                      setGroupName(conversationName)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-white font-medium">{groupName}</span>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors"
                    >
                      Редактировать
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Members List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Участники ({users.length})
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="relative group/member cursor-zoom-in"
                        onClick={(e) => {
                          if (user.avatarUrl) {
                            e.stopPropagation()
                            setEnlargedImage({ src: user.avatarUrl, alt: user.username })
                          } else {
                            onUserClick?.(user.id)
                          }
                        }}
                      >
                        {user.avatarUrl ? (
                          <div className="relative">
                            <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 group-hover/member:opacity-80 transition-all" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/member:opacity-100 transition-opacity pointer-events-none">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold group-hover/member:opacity-80 transition-opacity">
                            {user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <p 
                          className="font-medium text-gray-900 dark:text-white cursor-pointer hover:underline"
                          onClick={() => onUserClick?.(user.id)}
                        >
                          {user.username}
                        </p>
                        {user.id === adminId && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">Админ</span>
                        )}
                      </div>
                    </div>
                    {isAdmin && user.id !== adminId && (
                      <button
                        onClick={() => removeMember(user.id)}
                        disabled={loading}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm transition-colors disabled:opacity-50"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Admin Actions */}
            {isAdmin && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Передать владение
                </button>
                <button
                  onClick={deleteGroup}
                  disabled={loading}
                  className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Удалить группу
                </button>
              </div>
            )}
            
            {/* Leave Group */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={leaveGroup}
                disabled={loading}
                className="w-full text-left px-4 py-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Покинуть группу
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transfer Admin Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Передача владения</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Выберите нового администратора. Вы будете удалены из группы после передачи.
            </p>
            <select
              value={selectedNewAdmin}
              onChange={(e) => setSelectedNewAdmin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            >
              <option value="">Выберите участника...</option>
              {users.filter(u => u.id !== adminId).map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={transferAdmin}
                disabled={!selectedNewAdmin || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Передача...
                  </>
                ) : (
                  'Передать'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {enlargedImage && (
        <ImageModal
          src={enlargedImage.src}
          alt={enlargedImage.alt}
          onClose={() => setEnlargedImage(null)}
        />
      )}
    </>

  )
}