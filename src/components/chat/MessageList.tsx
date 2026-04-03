// src/components/chat/MessageList.tsx
'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'

interface Message {
  id: string
  content: string
  senderId: string
  sender: {
    id: string
    username: string
    avatarUrl: string | null
  }
  createdAt: string
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  typingUsers: Set<string>
}

export default function MessageList({ messages, currentUserId, typingUsers }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
      {Object.entries(messageGroups).map(([date, groupMessages]) => (
        <div key={date}>
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
              {date === new Date().toDateString() ? 'Сегодня' : date}
            </span>
          </div>
          
          {groupMessages.map(message => {
            const isOwn = message.senderId === currentUserId
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
              >
                <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isOwn && (
                    <div className="flex-shrink-0 mr-2">
                      {message.sender.avatarUrl ? (
                        <img
                          src={message.sender.avatarUrl}
                          alt={message.sender.username}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
                          {message.sender.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div>
                    {!isOwn && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">
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
                      <p className="break-words text-sm leading-relaxed">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      
      {typingUsers.size > 0 && (
        <div className="flex justify-start mb-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-sm">
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Array.from(typingUsers).map(userId => {
                  const message = messages.find(m => m.senderId === userId)
                  return message?.sender.username
                }).join(', ')}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">печатает</span>
              <div className="flex space-x-1 ml-1">
                                <div className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}