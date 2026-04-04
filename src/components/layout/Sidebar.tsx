// src/components/layout/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'

interface SidebarProps {
  children: React.ReactNode
  isOpen?: boolean
  hideToggle?: boolean
  onClose?: () => void
}

export default function Sidebar({ children, isOpen, onClose, hideToggle }: SidebarProps) {
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
      {/* Mobile menu and close button combined */}
      {!hideToggle && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className={`lg:hidden fixed z-45 p-2.5 rounded-xl transition-all duration-300 ease-in-out ${isMobileOpen
            ? 'top-4 left-[16.5rem] bg-gray-100 dark:bg-gray-700 shadow-none'
            : 'top-4 left-4 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        >
          <div className="relative w-5 h-5 flex justify-center items-center">
            <span className={`absolute h-0.5 w-5 bg-gray-700 dark:bg-gray-300 transform transition-all duration-300 ease-in-out ${isMobileOpen ? 'rotate-45' : '-translate-y-1.5'}`} />
            <span className={`absolute h-0.5 w-5 bg-gray-700 dark:bg-gray-300 transform transition-all duration-300 ease-in-out ${isMobileOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`absolute h-0.5 w-5 bg-gray-700 dark:bg-gray-300 transform transition-all duration-300 ease-in-out ${isMobileOpen ? '-rotate-45' : 'translate-y-1.5'}`} />
          </div>
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-80 lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-all duration-300 ease-in-out shadow-xl lg:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        />
      )}
    </>
  )
}