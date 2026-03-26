// src/components/layout/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'

interface SidebarProps {
  children: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ children, isOpen, onClose }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  useEffect(() => {
    if (isOpen !== undefined) {
      setIsMobileOpen(isOpen)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsMobileOpen(false)
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Open menu"
      >
        <svg
          className="w-5 h-5 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      
      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-80 lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-all duration-300 ease-in-out shadow-xl lg:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Mobile close button */}
          <div className="lg:hidden flex justify-end p-4 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          {children}
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
        />
      )}
    </>
  )
}