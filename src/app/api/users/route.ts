// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getOnlineUsers } from '@/lib/redis'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const currentUser = await getSession(token)
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    
    const where: any = {
      id: { not: currentUser.id }
    }
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          status: true,
          lastSeen: true,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { username: 'asc' }
      }),
      prisma.user.count({ where })
    ])
    
    // Get online users from Redis
    const onlineUsers = await getOnlineUsers()
    
    // Add online status to users
    const usersWithOnlineStatus = users.map((user: any) => ({
      ...user,
      isOnline: onlineUsers.includes(user.id),
      // Если пользователь онлайн, статус всегда ONLINE
      status: onlineUsers.includes(user.id) ? 'ONLINE' : user.status
    }))
    
    return NextResponse.json({
      users: usersWithOnlineStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}