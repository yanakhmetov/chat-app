

export interface User {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  status: 'ONLINE' | 'OFFLINE' | 'AWAY'
  lastSeen?: string | Date
  isOnline?: boolean
}

export interface Message {
  id: string
  content: string
  senderId: string
  conversationId: string
  readBy: string[]
  isSystem?: boolean
  createdAt: string | Date
  updatedAt?: string | Date
  sender?: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

export interface Conversation {
  id: string
  name: string | null
  isGroup: boolean
  adminId?: string | null  // Добавляем adminId
  createdAt: string | Date
  updatedAt: string | Date
  users: User[]
  messages: Message[]
  lastMessage?: Message
}

export interface AuthUser {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  status: string
}