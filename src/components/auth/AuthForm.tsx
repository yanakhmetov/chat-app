'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface AuthFormProps {
  type: 'login' | 'register'
}

export default function AuthForm({ type }: AuthFormProps) {
  const { login, register } = useAuth()
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
      if (type === 'login') {
        await login(formData.email, formData.password)
      } else {
        await register(formData.email, formData.username, formData.password)
      }
      
      console.log(`${type === 'login' ? 'Login' : 'Registration'} successful`)
      // Редирект уже есть внутри функций login/register в useAuthLogic, 
      // но если нет, можно добавить здесь или положиться на useEffect в других местах.
      // В нашем случае useAuthLogic.ts вызывает router.push('/conversations')
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Ошибка аутентификации')
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
          label="Имя пользователя"
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          placeholder="Выберите имя пользователя"
        />
      )}
      
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        placeholder="Введите ваш email"
      />
      
      <Input
        label="Пароль"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        placeholder="Введите ваш пароль"
      />
      
      <Button 
        type="submit" 
        isLoading={isLoading} 
        className="w-full mt-6"
        size="lg"
      >
        {type === 'login' ? 'Войти' : 'Зарегистрироваться'}
      </Button>
    </form>
  )
}