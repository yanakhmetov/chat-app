import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Get single conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getSession(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
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
          take: 50,
          orderBy: { createdAt: 'desc' },
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
      }
    })
    
    if (!conversation) {
      return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 })
    }
    
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Update conversation (add/remove users, rename group)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const currentUser = await getSession(token)
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const { name, addUsers, removeUsers, transferAdmin } = await req.json()
    
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        users: {
          some: { id: currentUser.id }
        }
      },
      include: {
        users: true
      }
    })
    
    if (!conversation) {
      return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 })
    }
    
    // Проверяем, что это групповая беседа
    if (!conversation.isGroup) {
      return NextResponse.json(
        { error: 'Это не групповой диалог' },
        { status: 400 }
      )
    }
    
    // Проверяем права администратора
    const isAdmin = conversation.adminId === currentUser.id
    
    // Для не-админов разрешаем только выход из группы
    if (!isAdmin && (name || addUsers || removeUsers || transferAdmin)) {
      // Разрешаем только выход из группы (удаление себя)
      if (removeUsers && removeUsers.length === 1 && removeUsers[0] === currentUser.id) {
        // Позволяем пользователю выйти из группы
      } else {
        return NextResponse.json(
          { error: 'Только администратор группы может выполнить это действие' },
          { status: 403 }
        )
      }
    }
    
    const updateData: any = {}
    
    // Переименование группы (только для админа)
    if (name && conversation.isGroup && isAdmin) {
      updateData.name = name
    }
    
    // Добавление пользователей (только для админа)
    if (addUsers && addUsers.length > 0 && conversation.isGroup && isAdmin) {
      // Проверяем, не добавлены ли уже эти пользователи
      const existingUserIds = conversation.users.map(u => u.id)
      const newUsers = addUsers.filter((id: string) => !existingUserIds.includes(id))
      
      if (newUsers.length > 0) {
        updateData.users = {
          connect: newUsers.map((id: string) => ({ id }))
        }
      }
    }
    
    // Удаление пользователей (админ может удалить любого, обычный пользователь - только себя)
    if (removeUsers && removeUsers.length > 0 && conversation.isGroup) {
      const canRemove = (userId: string) => {
        if (isAdmin) return true // Админ может удалить любого
        return userId === currentUser.id // Обычный пользователь только себя
      }
      
      const usersToRemove = removeUsers.filter(canRemove)
      
      // Нельзя удалить админа, если он не вышел сам
      if (!isAdmin && usersToRemove.includes(conversation.adminId!)) {
        return NextResponse.json(
          { error: 'Нельзя удалить администратора группы' },
          { status: 403 }
        )
      }
      
      // Если админ удаляет себя, нужно передать админство кому-то другому
      if (isAdmin && usersToRemove.includes(currentUser.id)) {
        if (!transferAdmin) {
          return NextResponse.json(
            { error: 'Вы должны передать права администратора перед выходом' },
            { status: 400 }
          )
        }
      }
      
      if (usersToRemove.length > 0) {
        updateData.users = {
          ...updateData.users,
          disconnect: usersToRemove.map((id: string) => ({ id }))
        }
      }
    }
    
    // Передача прав администратора
    if (transferAdmin && conversation.isGroup && isAdmin) {
      const newAdminId = transferAdmin
      const userExists = conversation.users.some(u => u.id === newAdminId)
      
      if (!userExists) {
        return NextResponse.json(
          { error: 'Пользователь не является участником этой группы' },
          { status: 400 }
        )
      }
      
      updateData.adminId = newAdminId
    }
    
    // Если после удаления пользователей группа стала пустой или остался только админ, можно удалить группу
    const updatedConversation = await prisma.conversation.update({
      where: { id: params.id },
      data: updateData,
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
    
    // Если админ вышел и передал права, или группа осталась без участников
    if (updatedConversation.users.length === 0) {
      await prisma.conversation.delete({
        where: { id: params.id }
      })
      return NextResponse.json({ message: 'Группа удалена' })
    }
    
    return NextResponse.json(updatedConversation)
  } catch (error) {
    console.error('Update conversation error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Delete conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const user = await getSession(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.id,
        users: {
          some: { id: user.id }
        }
      }
    })
    
    if (!conversation) {
      return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 })
    }
    
    // Только админ может удалить групповой чат
    if (conversation.isGroup && conversation.adminId !== user.id) {
      return NextResponse.json(
        { error: 'Только администратор группы может удалить эту группу' },
        { status: 403 }
      )
    }
    
    // Delete all messages first
    await prisma.message.deleteMany({
      where: { conversationId: params.id }
    })
    
    // Delete conversation
    await prisma.conversation.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Диалог успешно удален' })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}