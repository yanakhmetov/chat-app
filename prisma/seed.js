// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

async function main() {
  console.log('Начало заполнения базы данных...')

  const hashedPassword = await hashPassword(' ')

  // Создаём 6 пользователей с русскими именами и фамилиями
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alexey.sokolov@example.com',
        username: 'Алексей Соколов',
        password: hashedPassword,
        avatarUrl: null,
        status: 'ONLINE',
        lastSeen: new Date(),
      }
    }),
    prisma.user.create({
      data: {
        email: 'ekaterina.ivanova@example.com',
        username: 'Екатерина Иванова',
        password: hashedPassword,
        avatarUrl: null,
        status: 'ONLINE',
        lastSeen: new Date(),
      }
    }),
    prisma.user.create({
      data: {
        email: 'mikhail.petrov@example.com',
        username: 'Михаил Петров',
        password: hashedPassword,
        avatarUrl: null,
        status: 'ONLINE',
        lastSeen: new Date(),
      }
    }),
    prisma.user.create({
      data: {
        email: 'sofia.kuznetsova@example.com',
        username: 'София Кузнецова',
        password: hashedPassword,
        avatarUrl: null,
        status: 'OFFLINE',
        lastSeen: new Date(Date.now() - 3600000),
      }
    }),
    prisma.user.create({
      data: {
        email: 'dmitry.smirnov@example.com',
        username: 'Дмитрий Смирнов',
        password: hashedPassword,
        avatarUrl: null,
        status: 'OFFLINE',
        lastSeen: new Date(Date.now() - 7200000),
      }
    }),
    prisma.user.create({
      data: {
        email: 'anna.vasilyeva@example.com',
        username: 'Анна Васильева',
        password: hashedPassword,
        avatarUrl: null,
        status: 'AWAY',
        lastSeen: new Date(Date.now() - 1800000),
      }
    })
  ])

  console.log(`Создано ${users.length} пользователей:`)
  users.forEach(user => {
    console.log(`   - ${user.username} (${user.email}) - ${user.status}`)
  })

  // Создаём общую группу (администратор — первый пользователь)
  const adminUser = users[0]
  const groupUsers = users

  const groupConversation = await prisma.conversation.create({
    data: {
      name: 'Общий чат',
      isGroup: true,
      adminId: adminUser.id,
      users: {
        connect: groupUsers.map(user => ({ id: user.id }))
      }
    }
  })

  console.log(`\nСоздана группа: "${groupConversation.name}"`)
  console.log(`   Администратор: ${adminUser.username}`)
  console.log(`   Участники: ${groupUsers.length} пользователей`)

  // Создаём приватные чаты
  const privateChats = []
  
  // Алексей и Екатерина
  const chat1 = await prisma.conversation.create({
    data: {
      isGroup: false,
      adminId: null,
      users: {
        connect: [
          { id: users[0].id },
          { id: users[1].id }
        ]
      }
    }
  })
  privateChats.push({ id: chat1.id, user1: users[0], user2: users[1] })
  console.log(`Создан приватный чат между ${users[0].username} и ${users[1].username}`)
  
  // Алексей и Михаил
  const chat2 = await prisma.conversation.create({
    data: {
      isGroup: false,
      adminId: null,
      users: {
        connect: [
          { id: users[0].id },
          { id: users[2].id }
        ]
      }
    }
  })
  privateChats.push({ id: chat2.id, user1: users[0], user2: users[2] })
  console.log(`Создан приватный чат между ${users[0].username} и ${users[2].username}`)
  
  // Екатерина и Михаил
  const chat3 = await prisma.conversation.create({
    data: {
      isGroup: false,
      adminId: null,
      users: {
        connect: [
          { id: users[1].id },
          { id: users[2].id }
        ]
      }
    }
  })
  privateChats.push({ id: chat3.id, user1: users[1], user2: users[2] })
  console.log(`Создан приватный чат между ${users[1].username} и ${users[2].username}`)

  // Сообщения в групповом чате
  const groupMessages = [
    {
      content: "Добро пожаловать в общий чат!",
      senderId: users[0].id,
      conversationId: groupConversation.id,
    },
    {
      content: "Спасибо за приглашение! Рад быть здесь!",
      senderId: users[1].id,
      conversationId: groupConversation.id,
    },
    {
      content: "Отлично, что есть эта группа! Когда наша следующая встреча?",
      senderId: users[2].id,
      conversationId: groupConversation.id,
    },
    {
      content: "У нас встреча завтра в 10:00. Я отправлю ссылку",
      senderId: users[0].id,
      conversationId: groupConversation.id,
    },
    {
      content: "Отлично! Жду с нетерпением)",
      senderId: users[3].id,
      conversationId: groupConversation.id,
    },
  ]

  for (const message of groupMessages) {
    await prisma.message.create({
      data: message
    })
  }
  console.log(`\nСоздано ${groupMessages.length} сообщений в групповом чате`)

  // Сообщения в приватных чатах (имена адаптированы под новых пользователей)
  const privateMessages = [
    {
      content: "Привет, Екатерина! Как продвигается проект?",
      senderId: users[0].id,
      conversationId: privateChats[0].id,
    },
    {
      content: "Привет, Алексей! Всё хорошо, заканчиваю документацию",
      senderId: users[1].id,
      conversationId: privateChats[0].id,
    },
    {
      content: "Михаил, можешь проверить мой PR?",
      senderId: users[0].id,
      conversationId: privateChats[1].id,
    },
    {
      content: "Конечно! Смотрю сейчас",
      senderId: users[2].id,
      conversationId: privateChats[1].id,
    },
  ]

  for (const message of privateMessages) {
    await prisma.message.create({
      data: message
    })
  }
  console.log(`Создано ${privateMessages.length} сообщений в приватных чатах`)

  // Статистика
  const totalUsers = await prisma.user.count()
  const totalConversations = await prisma.conversation.count()
  const totalMessages = await prisma.message.count()

  console.log('\n Статистика базы данных:')
  console.log(`   Пользователи: ${totalUsers}`)
  console.log(`   Беседы: ${totalConversations}`)
  console.log(`   Сообщения: ${totalMessages}`)
  console.log('\n Заполнение базы данных успешно завершено!')
  console.log('\n Тестовые учетные данные (для всех пользователей):')
  console.log('   Пароль: password123')
  console.log('\n Примеры для входа:')
  users.forEach(user => {
    console.log(`   - ${user.email} (${user.username})`)
  })
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })