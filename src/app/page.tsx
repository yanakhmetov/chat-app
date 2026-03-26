'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    console.log('Home page - token exists:', !!token)
    
    if (token) {
      router.push('/conversations')
    } else {
      router.push('/login')
    }
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading...</h1>
        <p className="text-gray-500 dark:text-gray-400">Please wait while we redirect you</p>
      </div>
    </div>
  )
}