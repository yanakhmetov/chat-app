'use client'

import { useState, useEffect } from 'react'
import ImageModal from '../ui/ImageModal'


interface UserProfile {
  id: string
  username: string
  avatarUrl: string | null
  dateOfBirth: string | null
  hobbies: string | null
  education: string | null
  createdAt: string
}

interface UserProfileModalProps {
  userId: string
  currentUserId: string
  onClose: () => void
  onProfileUpdated?: (updatedUser: Partial<UserProfile>) => void
}

export default function UserProfileModal({ 
  userId, 
  currentUserId, 
  onClose,
  onProfileUpdated
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  
  // Edit form state
  const [formData, setFormData] = useState({
    username: '',
    avatarUrl: '',
    dateOfBirth: '',
    education: '',
    hobbies: ''
  })
  const [saving, setSaving] = useState(false)
  const [showEnlarged, setShowEnlarged] = useState(false)


  const isOwnProfile = userId === currentUserId

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setFormData({
          username: data.username || '',
          avatarUrl: data.avatarUrl || '',
          dateOfBirth: data.dateOfBirth || '',
          education: data.education || '',
          hobbies: data.hobbies || ''
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!isOwnProfile) return
    
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const updated = await res.json()
        setProfile(prev => prev ? { ...prev, ...updated } : updated)
        setIsEditing(false)
        if (onProfileUpdated) {
          onProfileUpdated(updated)
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-fade-in flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-spring"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">

          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isOwnProfile ? 'Мой профиль' : 'Профиль пользователя'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!isEditing ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                {profile?.avatarUrl ? (
                  <div 
                    className="relative cursor-zoom-in transition-transform active:scale-95"
                    onClick={() => setShowEnlarged(true)}
                  >
                    <img 
                      src={profile.avatarUrl} 
                      alt="Аватар" 
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                    {profile?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>


              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.username}</h3>
                {profile?.createdAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    В ChatApp с {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Дата рождения</p>
                  <p className="text-gray-900 dark:text-white font-medium">{profile?.dateOfBirth || 'Не указана'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Образование</p>
                  <p className="text-gray-900 dark:text-white font-medium">{profile?.education || 'Не указано'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Увлечения (хобби)</p>
                  <p className="text-gray-900 dark:text-white font-medium">{profile?.hobbies || 'Не указаны'}</p>
                </div>
              </div>

              {isOwnProfile && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition"
                >
                  Редактировать профиль
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Никнейм</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Аватарки</label>
                <input
                  type="text"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата рождения</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Образование</label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                  placeholder="Место учебы..."
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Хобби</label>
                <textarea
                  value={formData.hobbies}
                  onChange={(e) => setFormData({...formData, hobbies: e.target.value})}
                  placeholder="Чем вы увлекаетесь?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.username.trim()}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      
      {showEnlarged && profile?.avatarUrl && (
        <ImageModal
          src={profile.avatarUrl}
          alt={profile.username}
          onClose={() => setShowEnlarged(false)}
        />
      )}
    </>

  )
}
