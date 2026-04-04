
'use client'

import { formatDistanceToNow } from 'date-fns'
import type { Message, User } from '@/types'

interface ConversationItemProps {
  id: string
  name: string | null
  isGroup: boolean
  lastMessage?: Message
  users: User[]
  currentUserId: string
  isSelected: boolean
  onClick: () => void
}

export default function ConversationItem({
  id,
  name,
  isGroup,
  lastMessage,
  users,
  currentUserId,
  isSelected,
  onClick
}: ConversationItemProps) {
  const getDisplayName = () => {
    if (isGroup) {
      return name || 'Групповой чат'
    }
    const otherUser = users.find(u => u.id !== currentUserId)
    return otherUser?.username || 'Неизвестный пользователь'
  }

  const getAvatar = () => {
    if (isGroup) {
      return (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-white text-xl shadow-md">
          👥
        </div>
      )
    }
    const otherUser = users.find(u => u.id !== currentUserId)
    if (otherUser?.avatarUrl) {
      return (
        <img 
          src={otherUser.avatarUrl} 
          alt={otherUser.username} 
          className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-md"
        />
      )
    }
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
        {otherUser?.username?.[0]?.toUpperCase() || 'U'}
      </div>
    )
  }

  const getStatus = () => {
    if (isGroup) return null
    const otherUser = users.find(u => u.id !== currentUserId)
    const isOnline = otherUser?.status === 'ONLINE' || otherUser?.isOnline
    
    return isOnline ? (
      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"></span>
    ) : null
  }

  const getLastMessageText = () => {
    if (!lastMessage) return 'Пока нет сообщений'
    
    const isOwn = lastMessage.senderId === currentUserId
    const senderName = isOwn ? 'Вы' : (lastMessage.sender?.username || 'Неизвестный')
    const content = lastMessage.content.substring(0, 30)
    const suffix = lastMessage.content.length > 30 ? '...' : ''
    
    return `${senderName}: ${content}${suffix}`
  }

  const getTimeAgo = () => {
    if (!lastMessage?.createdAt) return ''
    return formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-blue-500' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div className="relative flex-shrink-0">
        {getAvatar()}
        {getStatus()}
      </div>
      
      <div className="flex-1 ml-3 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className={`font-semibold truncate ${
            isSelected 
              ? 'text-blue-900 dark:text-blue-300' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {getDisplayName()}
          </h3>
          {lastMessage && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
              {getTimeAgo()}
            </span>
          )}
        </div>
        <p className={`text-sm truncate ${
          isSelected 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {getLastMessageText()}
        </p>
      </div>
    </div>
  )
}