import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET - получить все conversations
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getSession(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const conversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: { id: user.id }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            status: true,
            lastSeen: true,
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      name: conv.name,
      isGroup: conv.isGroup,
      adminId: conv.adminId,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      users: conv.users,
      messages: conv.messages,
      lastMessage: conv.messages[0]
    }))
    
    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
        { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST - создать новый conversation
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const currentUser = await getSession(token)
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { userIds, isGroup, name } = await req.json()
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Неверные ID пользователей' },
        { status: 400 }
      )
    }
    
    // Убедимся, что текущий пользователь включен в список
    const allUserIds = [currentUser.id, ...userIds]
    // Удаляем возможные дубликаты
    const uniqueUserIds = Array.from(new Set(allUserIds))
    
    // Проверяем, существует ли уже приватный чат (только для 1 на 1)
    if (!isGroup && userIds.length === 1) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { users: { some: { id: currentUser.id } } },
            { users: { some: { id: userIds[0] } } }
          ]
        },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            }
          }
        }
      })
      
      if (existingConversation) {
        return NextResponse.json(existingConversation)
      }
    }
    
    // Для группового чата проверяем, существует ли уже чат с такими же участниками
    if (isGroup && uniqueUserIds.length > 2) {
      const existingGroup = await prisma.conversation.findFirst({
        where: {
          isGroup: true,
          AND: [
            { users: { every: { id: { in: uniqueUserIds } } } },
            { users: { some: { id: currentUser.id } } }
          ]
        },
        include: {
          users: true
        }
      })
      
      // Проверяем, что количество участников совпадает
      if (existingGroup && existingGroup.users.length === uniqueUserIds.length) {
        // Проверяем, что все участники совпадают
        const existingUserIds = existingGroup.users.map(u => u.id)
        const allMatch = uniqueUserIds.every(id => existingUserIds.includes(id))
        
        if (allMatch) {
          return NextResponse.json(existingGroup)
        }
      }
    }
    
    // Создаем новый conversation
    const conversation = await prisma.conversation.create({
      data: {
        name: isGroup ? (name || 'Групповой чат') : null,
        isGroup: isGroup || false,
        adminId: isGroup ? currentUser.id : null, // Только для групп устанавливаем админа
        users: {
          connect: uniqueUserIds.map((id: string) => ({ id }))
        }
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            status: true,
          }
        }
      }
    })
    
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}