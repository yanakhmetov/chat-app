// src/middleware.ts - добавим логирование
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl
  
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isApiRoute = pathname.startsWith('/api')
  const isStaticFile = pathname.includes('/_next') || pathname.includes('/favicon.ico')
  
  // Пропускаем API и статические файлы
  if (isApiRoute || isStaticFile) {
    return NextResponse.next()
  }
  
  // Если нет токена и пытаемся зайти на защищенную страницу
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Если есть токен и пытаемся зайти на страницу авторизации
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/conversations', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}