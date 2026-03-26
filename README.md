# Real-time Chat Application

## Описание

Современное веб-приложение для обмена сообщениями в реальном времени с поддержкой групповых чатов, приватных сообщений, онлайн-статусов и темной темы.

## Технологии

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Socket.IO
- **Database:** PostgreSQL, Prisma ORM
- **Cache & Real-time:** Redis
- **Authentication:** JWT (JSON Web Tokens)
- **Containerization:** Docker, Docker Compose

## Функциональность

- ✅ Регистрация и авторизация пользователей
- ✅ Приватные чаты 1-on-1
- ✅ Групповые чаты с возможностью добавления/удаления участников
- ✅ Отправка сообщений в реальном времени (Socket.IO)
- ✅ Индикатор набора текста (typing indicator)
- ✅ Онлайн-статус пользователей
- ✅ Темная тема (светлая/темная)
- ✅ Поиск пользователей и чатов
- ✅ Адаптивный дизайн

### Требования

- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)
- Git

## Быстрый запуск с Docker

# Полная пересборка с очисткой (первый запуск)
.\rebuild.ps1 

# Обычный запуск (без пересборки)
.\start.ps1

# Остановка запуск
.\stop.ps1

# Полный сброс
.\reset.ps1

# Команда для разрешения выполнения скириптов 
# Откройте PowerShell от имени администратора и введите:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd chat-app