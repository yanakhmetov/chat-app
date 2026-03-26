// src/components/auth/AuthForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface AuthFormProps {
  type: 'login' | 'register'
}

export default function AuthForm({ type }: AuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = type === 'login' 
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, username: formData.username }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      // Сохраняем в localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Сохраняем токен в cookies для middleware
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 дней
      
      console.log('Login successful, redirecting...')
      
      // Редирект
      router.push('/conversations')
      
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
      
      {type === 'register' && (
        <Input
          label="Username"
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          placeholder="Choose a username"
        />
      )}
      
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        placeholder="Enter your email"
      />
      
      <Input
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        placeholder="Enter your password"
      />
      
      <Button 
        type="submit" 
        isLoading={isLoading} 
        className="w-full mt-6"
        size="lg"
      >
        {type === 'login' ? 'Sign In' : 'Sign Up'}
      </Button>
    </form>
  )
}