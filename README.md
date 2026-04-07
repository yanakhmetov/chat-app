# 💬 Real-time Chat Application

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.5-black?style=for-the-badge&logo=socket.io)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Современное веб-приложение для обмена сообщениями в реальном времени, построенное на базе Next.js и Socket.IO. Проект ориентирован на высокую производительность, отзывчивый интерфейс и надежную доставку сообщений.

---

## ✨ Основные возможности

*   **🚀 Реальное время:** Мгновенная доставка сообщений через WebSockets (Socket.IO).
*   **👥 Групповые и приватные чаты:** Создание групп с администрированием или общение тет-а-тет.
*   **🟢 Статусы пользователей:** Отслеживание онлайн-статуса и времени последнего посещения.
*   **⌨️ Индикатор набора текста:** Визуальное отображение, когда собеседник пишет сообщение.
*   **✔️ Статус прочтения:** Индикация того, что сообщение было прочитано участниками.
*   **🔍 Умный поиск:** Поиск по пользователям и существующим диалогам.
*   **🌓 Темная тема:** Современный дизайн с поддержкой светлой и темной тем.
*   **📱 Адаптивность:** Полностью отзывчивый интерфейс, оптимизированный для мобильных устройств.
*   **👤 Профили пользователей:** Редактирование информации о себе (аватар, хобби, образование).

---

## 🛠 Технологический стек

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State Management:** React Hooks / Context API
- **Icons:** React Icons

### Backend
- **Server:** Node.js (Custom Express/HTTP server for Socket.io integration)
- **Real-time:** Socket.IO
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Caching:** Redis (для масштабируемости Socket.io)
- **Auth:** JWT (JSON Web Tokens) + BcryptJS

---

## 🚀 Быстрый запуск (Docker)

Это самый простой способ запустить проект со всеми зависимостями (БД, Redis).

1.  **Клонируйте репозиторий:**
    ```bash
    git clone https://github.com/yanakhmetov/chat-app.git
    cd chat-app
    ```

2.  **Запустите проект с помощью PowerShell скриптов:**
    - Для первого запуска (сборка и инициализация):
      ```powershell
      .\rebuild.ps1
      ```
    - Для последующих запусков:
      ```powershell
      .\start.ps1
      ```
    - Для остановки:
      ```powershell
      .\stop.ps1
      ```

> [!IMPORTANT]
> Если PowerShell блокирует запуск скриптов, выполните команду:
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

## 🛠 Локальная разработка

Если вы хотите запустить проект локально (без Docker), убедитесь, что у вас установлены Node.js, PostgreSQL и Redis.

1.  **Установите зависимости:**
    ```bash
    npm install
    ```

2.  **Настройте переменные окружения:**
    Создайте файл `.env` в корне проекта (используйте `.env.docker` как образец):
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/chat_app"
    REDIS_URL="redis://localhost:6379"
    JWT_SECRET="ваш-очень-секретный-ключ"
    ```

3.  **Инициализируйте базу данных:**
    ```bash
    npx prisma db push
    npm run db:seed
    ```

4.  **Запустите сервер разработки:**
    ```bash
    npm run dev
    ```

---

## 📝 Доступные скрипты

- `npm run dev` — Запуск сервера разработки (с Socket.io).
- `npm run build` — Сборка проекта для продакшена.
- `npm run start` — Запуск собранного приложения.
- `npm run db:studio` — Визуальный интерфейс для управления базой данных (Prisma Studio).
- `npm run prisma:generate` — Генерация Prisma Client.

---

