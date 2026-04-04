
'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import ImageModal from '../ui/ImageModal'


interface Message {
  id: string
  content: string
  senderId: string
  sender: {
    id: string
    username: string
    avatarUrl: string | null
  }
  readBy: string[]
  conversationId: string
  isSystem?: boolean
  createdAt: string
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  typingUsers: Set<string>
  isGroup?: boolean
  onUserClick?: (userId: string) => void
}

export default function MessageList({ messages, currentUserId, typingUsers, isGroup, onUserClick }: MessageListProps) {
  const [enlargedImage, setEnlargedImage] = useState<{ src: string, alt: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUsers.size])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date)
    const now = new Date()
    
    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, 'HH:mm')
    }
    
    return format(messageDate, 'MMM d, HH:mm')
  }

  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  const messageGroups = groupMessagesByDate()

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-0 space-y-4 bg-gray-50 dark:bg-gray-900">
      {Object.entries(messageGroups).map(([date, groupMessages]) => (
        <div key={date}>
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
              {date === new Date().toDateString() ? 'Сегодня' : date}
            </span>
          </div>
          
          {groupMessages.map(message => {
            if (message.isSystem) {
              return (
                <div key={message.id} className="flex justify-center mb-4 animate-fade-in">
                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs px-4 py-1.5 rounded-full text-center">
                    {message.content}
                  </div>
                </div>
              )
            }

            const isOwn = message.senderId === currentUserId
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
              >
                <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && (
                      <div 
                        className="flex-shrink-0 mr-2 max-[468px]:hidden cursor-pointer group/avatar relative"
                      >
                        {message.sender.avatarUrl ? (
                          <div className="relative">
                            <img
                              src={message.sender.avatarUrl}
                              alt={message.sender.username}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEnlargedImage({ src: message.sender.avatarUrl!, alt: message.sender.username })
                              }}
                            />
                            <div 
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none"
                            >
                              <div className="bg-black/20 rounded-full p-1">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-md hover:opacity-80 transition-opacity"
                            onClick={() => onUserClick?.(message.senderId)}
                          >
                            {message.sender.username[0].toUpperCase()}
                          </div>
                        )}
                        {/* Area to still open profile even if image is clicked? No, let's keep it separate or just let the username open profile. */}
                      </div>

                  )}
                  
                  <div className="flex-1 min-w-0">
                    {!isOwn && isGroup && (
                      <p 
                        className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1 truncate cursor-pointer hover:underline"
                        onClick={() => onUserClick?.(message.senderId)}
                      >
                        {message.sender.username}
                      </p>
                    )}
                    
                    <div
                      className={`rounded-2xl px-4 py-2 shadow-sm ${
                        isOwn
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <p className="break-all whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      <div className="flex items-center justify-between mt-1 space-x-2">
                        <p
                          className={`text-[10px] ${
                            isOwn ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                        
                        {isOwn && (
                          <div className="flex items-center">
                            {message.readBy && message.readBy.length > 1 ? (
                              <svg className="w-[18px] h-[18px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9.5 13 12.5 16 20.5 8" />
                                <polyline points="2 13 5 16 13 8" />
                              </svg>
                            ) : (
                              <svg className="w-[18px] h-[18px] text-blue-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      <div className="relative h-0 !mt-0">
        <div className={`absolute bottom-0 left-[40px] max-[468px]:left-0 transition-opacity duration-300 w-fit ${typingUsers.size > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="h-[12px] mt-[2px] mb-[2px] flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-md px-2 border border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-end space-x-1.5 pb-[2px]">
              {isGroup && (
                <span className="text-[10px] text-gray-500/90 dark:text-gray-400/90 font-medium whitespace-nowrap leading-none">
                  {Array.from(typingUsers)
                    .map(userId => messages.find(m => m.senderId === userId)?.sender.username)
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
              <span className="text-[10px] text-gray-400/80 dark:text-gray-500/80 italic whitespace-nowrap leading-none">печатает</span>
              <div className="flex space-x-[3px] items-end pb-[1px]">
                <div className="w-0.5 h-0.5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-0.5 h-0.5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-0.5 h-0.5 bg-blue-500/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div ref={messagesEndRef} className="h-0 !mt-0" />
      
      {enlargedImage && (
        <ImageModal
          src={enlargedImage.src}
          alt={enlargedImage.alt}
          onClose={() => setEnlargedImage(null)}
        />
      )}
    </div>

  )
}