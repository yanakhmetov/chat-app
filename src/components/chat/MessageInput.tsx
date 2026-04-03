// src/components/chat/MessageInput.tsx (альтернативная версия со счетчиком внутри поля)
'use client'

import { useState, useRef, useEffect } from 'react'
import Button from '../ui/Button'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  onTyping: (isTyping: boolean) => void
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message)
      setMessage('')
      onTyping(false)
      setIsTyping(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value
    setMessage(newMessage)
    
    if (!isTyping && newMessage.trim()) {
      setIsTyping(true)
      onTyping(true)
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false)
        onTyping(false)
      }
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" >
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            {/* Подсказка и счетчик внутри поля ввода */}
            <div className="absolute right-3 bottom-2.5 flex gap-2">
              {message.trim() && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ↵
                </span>
              )}
              {message.length > 0 && (
                <span className={`text-xs ${message.length > 1000 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {message.length}/1000
                </span>
              )}
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={!message.trim()}
            className="px-1.5 py-2 mt-auto mb-auto md:px-5 md:py-2.5 shadow-sm hover:shadow-md transition-all flex-shrink-0"
          >
            <svg className="w-5 h-5 md:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className='hidden sm:block'>Отправить</span>
          </Button>
        </div>
      </form>
    </div>
  )
}