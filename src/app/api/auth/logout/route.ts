import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Clear any server-side sessions if needed
    // In this implementation, we rely on client-side token removal
    
    return NextResponse.json({ message: 'Выход выполнен успешно' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}