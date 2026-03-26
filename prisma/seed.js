// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

async function main() {
  console.log('🌱 Starting seed...')

  const hashedPassword = await hashPassword('password123')

  // Создаем 6 пользователей
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alex@example.com',
        username: 'AlexJohnson',
        password: hashedPassword,
        avatarUrl: null,
        status: 'ONLINE',
        lastSeen: new Date(),
      }
    }),
    prisma.user.create({
      data: {
        email: 'emma@example.com',
        username: 'EmmaWilson',
        password: hashedPassword,
        avatarUrl: null,
        status: 'ONLINE',
        lastSeen: new Date(),
      }
    }),
    prisma.user.create({
      data: {
        email: 'michael@example.com',
        username: 'MichaelBrown',
        password: hashedPassword,
        avatarUrl: null,
        status: 'ONLINE',
        lastSeen: new Date(),
      }
    }),
    prisma.user.create({
      data: {
        email: 'sophia@example.com',
        username: 'SophiaDavis',
        password: hashedPassword,
        avatarUrl: null,
        status: 'OFFLINE',
        lastSeen: new Date(Date.now() - 3600000),
      }
    }),
    prisma.user.create({
      data: {
        email: 'james@example.com',
        username: 'JamesMiller',
        password: hashedPassword,
        avatarUrl: null,
        status: 'OFFLINE',
        lastSeen: new Date(Date.now() - 7200000),
      }
    }),
    prisma.user.create({
      data: {
        email: 'olivia@example.com',
        username: 'OliviaTaylor',
        password: hashedPassword,
        avatarUrl: null,
        status: 'AWAY',
        lastSeen: new Date(Date.now() - 1800000),
      }
    })
  ])

  console.log(`✅ Created ${users.length} users:`)
  users.forEach(user => {
    console.log(`   - ${user.username} (${user.email}) - ${user.status}`)
  })

  // Создаем общую группу
  const adminUser = users[0]
  const groupUsers = users

  const groupConversation = await prisma.conversation.create({
    data: {
      name: 'Team Chat 💬',
      isGroup: true,
      adminId: adminUser.id,
      users: {
        connect: groupUsers.map(user => ({ id: user.id }))
      }
    }
  })

  console.log(`\n✅ Created group: "${groupConversation.name}"`)
  console.log(`   Admin: ${adminUser.username}`)
  console.log(`   Members: ${groupUsers.length} users`)

  // Создаем приватные чаты
  const privateChats = []
  
  // Alex и Emma
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
  console.log(`✅ Created private chat between ${users[0].username} and ${users[1].username}`)
  
  // Alex и Michael
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
  console.log(`✅ Created private chat between ${users[0].username} and ${users[2].username}`)
  
  // Emma и Michael
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
  console.log(`✅ Created private chat between ${users[1].username} and ${users[2].username}`)

  // Создаем сообщения в групповом чате
  const groupMessages = [
    {
      content: "Welcome everyone to the team chat! 🎉",
      senderId: users[0].id,
      conversationId: groupConversation.id,
    },
    {
      content: "Thanks for adding me! Happy to be here 😊",
      senderId: users[1].id,
      conversationId: groupConversation.id,
    },
    {
      content: "Great to have this group! When's our next meeting?",
      senderId: users[2].id,
      conversationId: groupConversation.id,
    },
    {
      content: "We have a meeting tomorrow at 10 AM. I'll send the link 🔗",
      senderId: users[0].id,
      conversationId: groupConversation.id,
    },
    {
      content: "Perfect! Looking forward to it 👍",
      senderId: users[3].id,
      conversationId: groupConversation.id,
    },
  ]

  for (const message of groupMessages) {
    await prisma.message.create({
      data: message
    })
  }
  console.log(`\n✅ Created ${groupMessages.length} messages in group chat`)

  // Создаем сообщения в приватных чатах
  const privateMessages = [
    {
      content: "Hey Emma, how's the project going?",
      senderId: users[0].id,
      conversationId: privateChats[0].id,
    },
    {
      content: "Hi Alex! Going well, just finishing the documentation 📝",
      senderId: users[1].id,
      conversationId: privateChats[0].id,
    },
    {
      content: "Michael, can you review my PR?",
      senderId: users[0].id,
      conversationId: privateChats[1].id,
    },
    {
      content: "Sure thing! I'll take a look now 👀",
      senderId: users[2].id,
      conversationId: privateChats[1].id,
    },
  ]

  for (const message of privateMessages) {
    await prisma.message.create({
      data: message
    })
  }
  console.log(`✅ Created ${privateMessages.length} messages in private chats`)

  // Статистика
  const totalUsers = await prisma.user.count()
  const totalConversations = await prisma.conversation.count()
  const totalMessages = await prisma.message.count()

  console.log('\n📊 Database Statistics:')
  console.log(`   Users: ${totalUsers}`)
  console.log(`   Conversations: ${totalConversations}`)
  console.log(`   Messages: ${totalMessages}`)
  console.log('\n✨ Seed completed successfully!')
  console.log('\n🔑 Test credentials (all users):')
  console.log('   Password: password123')
  console.log('\n📝 Example logins:')
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