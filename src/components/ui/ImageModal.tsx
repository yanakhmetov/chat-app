'use client'

import { useEffect, useState } from 'react'

interface ImageModalProps {
  src: string
  alt: string
  onClose: () => void
}

export default function ImageModal({ src, alt, onClose }: ImageModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [scale, setScale] = useState(1)


  useEffect(() => {
    setIsMounted(true)
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    // Prevent default scrolling when zooming
    const preventDefault = (e: WheelEvent) => {
      if (e.ctrlKey || scale !== 1) {
        e.preventDefault()
      }
    }
    
    window.addEventListener('keydown', handleEsc)
    window.addEventListener('wheel', preventDefault, { passive: false })
    
    return () => {
      window.removeEventListener('keydown', handleEsc)
      window.removeEventListener('wheel', preventDefault)
    }
  }, [onClose, scale])

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.001
    const newScale = Math.min(Math.max(0.5, scale + delta), 5)
    setScale(newScale)
  }

  const resetZoom = () => setScale(1)


  if (!isMounted) return null

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in cursor-zoom-out select-none"
      onClick={onClose}
      onWheel={handleWheel}
      onDoubleClick={resetZoom}
    >

      <div className="absolute top-4 right-4 z-[110]">
        <button 
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div 
        className="relative max-w-[90vw] max-h-[90vh] transition-transform duration-200 ease-out flex items-center justify-center"
        style={{ transform: `scale(${scale})` }}
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl selection:bg-transparent pointer-events-none"
          draggable={false}
        />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 font-medium whitespace-nowrap bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
          {alt}
        </div>
      </div>


    </div>
  )
}
