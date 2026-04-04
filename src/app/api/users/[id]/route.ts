import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        dateOfBirth: true,
        hobbies: true,
        education: true,
        status: true,
        lastSeen: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Fetch user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = verifyToken(token)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (auth.userId !== params.id) {
      return NextResponse.json({ error: 'Unforbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { username, avatarUrl, dateOfBirth, hobbies, education } = body

    // Optional: add uniqueness check for username if it's changing
    if (username) {
        const existing = await prisma.user.findFirst({
            where: {
                username,
                id: { not: params.id }
            }
        })
        if (existing) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
        }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(username !== undefined && { username }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(hobbies !== undefined && { hobbies }),
        ...(education !== undefined && { education }),
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        dateOfBirth: true,
        hobbies: true,
        education: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
