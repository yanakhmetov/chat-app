// // server.js
// const { createServer } = require('http')
// const { parse } = require('url')
// const next = require('next')
// const { Server } = require('socket.io')
// const { PrismaClient } = require('@prisma/client')
// const jwt = require('jsonwebtoken')

// const dev = process.env.NODE_ENV !== 'production'
// const app = next({ dev })
// const handle = app.getRequestHandler()

// const prisma = new PrismaClient()
// const JWT_SECRET = process.env.JWT_SECRET

// // Redis functions (упрощенные для теста)
// const onlineUsers = new Set()
// const userSockets = new Map()

// const storeUserSocket = (userId, socketId) => {
//   userSockets.set(userId, socketId)
// }

// const removeUserSocket = (userId) => {
//   userSockets.delete(userId)
// }

// const setUserOnline = (userId) => {
//   onlineUsers.add(userId)
// }

// const setUserOffline = (userId) => {
//   onlineUsers.delete(userId)
// }

// const getUserSocket = (userId) => {
//   return userSockets.get(userId)
// }

// const getOnlineUsers = () => {
//   return Array.from(onlineUsers)
// }

// app.prepare().then(() => {
//   const server = createServer((req, res) => {
//     const parsedUrl = parse(req.url, true)
//     handle(req, res, parsedUrl)
//   })

//   const io = new Server(server, {
//     path: '/api/socket',
//     addTrailingSlash: false,
//     cors: {
//       origin: 'http://localhost:3000',
//       credentials: true,
//       methods: ['GET', 'POST']
//     },
//     transports: ['websocket', 'polling']
//   })

//   // Middleware для аутентификации
//   io.use(async (socket, next) => {
//     const token = socket.handshake.auth.token
//     console.log('Socket auth - token received:', !!token)
    
//     if (!token) {
//       return next(new Error('Authentication error'))
//     }
    
//     try {
//       const decoded = jwt.verify(token, JWT_SECRET)
//       socket.data.userId = decoded.userId
//       console.log('Socket authenticated for user:', decoded.userId)
//       next()
//     } catch (error) {
//       console.error('Socket auth error:', error)
//       next(new Error('Authentication error'))
//     }
//   })

//   io.on('connection', async (socket) => {
//     const userId = socket.data.userId
//     console.log(`✅ User ${userId} connected, socket ID: ${socket.id}`)
    
//     try {
//       // Store connection
//       storeUserSocket(userId, socket.id)
//       setUserOnline(userId)
      
//       // Update user status in database
//       await prisma.user.update({
//         where: { id: userId },
//         data: { status: 'ONLINE', lastSeen: new Date() }
//       })
      
//       // Broadcast to others
//       socket.broadcast.emit('user:online', { userId })
      
//       // Send online users list to new user
//       const onlineUsersList = getOnlineUsers()
//       socket.emit('users:online', { userIds: onlineUsersList })
      
//       console.log(`Online users: ${onlineUsersList.join(', ')}`)
//     } catch (error) {
//       console.error('Error in connection:', error)
//     }
    
//     socket.on('message:send', async (data) => {
//       const { conversationId, content } = data
//       console.log(`Message from ${userId} in ${conversationId}: ${content}`)
      
//       try {
//         const message = await prisma.message.create({
//           data: {
//             content,
//             senderId: userId,
//             conversationId,
//           },
//           include: {
//             sender: {
//               select: {
//                 id: true,
//                 username: true,
//                 avatarUrl: true,
//               }
//             }
//           }
//         })
        
//         const conversation = await prisma.conversation.findUnique({
//           where: { id: conversationId },
//           include: { users: { select: { id: true } } }
//         })
        
//         if (conversation) {
//           for (const user of conversation.users) {
//             const userSocketId = getUserSocket(user.id)
//             if (userSocketId) {
//               io.to(userSocketId).emit('message:new', message)
//             }
//           }
//         }
//       } catch (error) {
//         console.error('Error sending message:', error)
//       }
//     })
    
//     socket.on('typing:start', async (data) => {
//       const { conversationId } = data
      
//       try {
//         const conversation = await prisma.conversation.findUnique({
//           where: { id: conversationId },
//           include: { users: { select: { id: true } } }
//         })
        
//         if (conversation) {
//           for (const user of conversation.users) {
//             if (user.id !== userId) {
//               const userSocketId = getUserSocket(user.id)
//               if (userSocketId) {
//                 io.to(userSocketId).emit('typing:start', {
//                   conversationId,
//                   userId,
//                 })
//               }
//             }
//           }
//         }
//       } catch (error) {
//         console.error('Error handling typing:', error)
//       }
//     })
    
//     socket.on('typing:stop', async (data) => {
//       const { conversationId } = data
      
//       try {
//         const conversation = await prisma.conversation.findUnique({
//           where: { id: conversationId },
//           include: { users: { select: { id: true } } }
//         })
        
//         if (conversation) {
//           for (const user of conversation.users) {
//             if (user.id !== userId) {
//               const userSocketId = getUserSocket(user.id)
//               if (userSocketId) {
//                 io.to(userSocketId).emit('typing:stop', {
//                   conversationId,
//                   userId
//                 })
//               }
//             }
//           }
//         }
//       } catch (error) {
//         console.error('Error handling typing stop:', error)
//       }
//     })
    
//     socket.on('disconnect', async () => {
//       console.log(`❌ User ${userId} disconnected`)
      
//       try {
//         removeUserSocket(userId)
//         setUserOffline(userId)
        
//         await prisma.user.update({
//           where: { id: userId },
//           data: { status: 'OFFLINE', lastSeen: new Date() }
//         })
        
//         socket.broadcast.emit('user:offline', { userId })
//       } catch (error) {
//         console.error('Error in disconnect:', error)
//       }
//     })
//   })

//   const PORT = process.env.PORT || 3000
  
//   server.listen(PORT, () => {
//     console.log(`> Ready on http://localhost:${PORT}`)
//     console.log(`> Socket.IO server running on /api/socket`)
//   })
// })


// server.js
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

// Проверка наличия JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET не установлен в переменных окружения. Используется секрет по умолчанию. Пожалуйста, установите его в продакшене!')
}

// Redis functions (упрощенные для теста)
const onlineUsers = new Set()
const userSockets = new Map()

const storeUserSocket = (userId, socketId) => {
  userSockets.set(userId, socketId)
}

const removeUserSocket = (userId) => {
  userSockets.delete(userId)
}

const setUserOnline = (userId) => {
  onlineUsers.add(userId)
}

const setUserOffline = (userId) => {
  onlineUsers.delete(userId)
}

const getUserSocket = (userId) => {
  return userSockets.get(userId)
}

const getOnlineUsers = () => {
  return Array.from(onlineUsers)
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  })

  // Middleware для аутентификации
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    console.log('Socket auth - token received:', !!token)
    
    if (!token) {
      console.log('Токен не предоставлен')
      return next(new Error('Ошибка аутентификации: Токен не предоставлен'))
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.data.userId = decoded.userId
      console.log('Socket authenticated for user:', decoded.userId)
      next()
    } catch (error) {
      console.error('Socket auth error:', error.message)
      next(new Error('Ошибка аутентификации: ' + error.message))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.data.userId
    console.log(`✅ User ${userId} connected, socket ID: ${socket.id}`)
    
    try {
      // Store connection
      storeUserSocket(userId, socket.id)
      setUserOnline(userId)
      
      // Update user status in database
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'ONLINE', lastSeen: new Date() }
      })
      
      // Broadcast to others
      socket.broadcast.emit('user:online', { userId })
      
      // Send online users list to new user
      const onlineUsersList = getOnlineUsers()
      socket.emit('users:online', { userIds: onlineUsersList })
      
      console.log(`Online users: ${onlineUsersList.join(', ')}`)
    } catch (error) {
      console.error('Error in connection:', error)
    }
    
    socket.on('message:send', async (data) => {
      const { conversationId, content } = data
      console.log(`Message from ${userId} in ${conversationId}: ${content}`)
      
      try {
        const message = await prisma.message.create({
          data: {
            content,
            senderId: userId,
            conversationId,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              }
            }
          }
        })
        
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { users: { select: { id: true } } }
        })
        
        if (conversation) {
          for (const user of conversation.users) {
            const userSocketId = getUserSocket(user.id)
            if (userSocketId) {
              io.to(userSocketId).emit('message:new', message)
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
      }
    })
    
    socket.on('typing:start', async (data) => {
      const { conversationId } = data
      
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { users: { select: { id: true } } }
        })
        
        if (conversation) {
          for (const user of conversation.users) {
            if (user.id !== userId) {
              const userSocketId = getUserSocket(user.id)
              if (userSocketId) {
                io.to(userSocketId).emit('typing:start', {
                  conversationId,
                  userId,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error handling typing:', error)
      }
    })
    
    socket.on('typing:stop', async (data) => {
      const { conversationId } = data
      
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { users: { select: { id: true } } }
        })
        
        if (conversation) {
          for (const user of conversation.users) {
            if (user.id !== userId) {
              const userSocketId = getUserSocket(user.id)
              if (userSocketId) {
                io.to(userSocketId).emit('typing:stop', {
                  conversationId,
                  userId
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('Error handling typing stop:', error)
      }
    })
    
    socket.on('disconnect', async () => {
      console.log(`❌ User ${userId} disconnected`)
      
      try {
        removeUserSocket(userId)
        setUserOffline(userId)
        
        await prisma.user.update({
          where: { id: userId },
          data: { status: 'OFFLINE', lastSeen: new Date() }
        })
        
        socket.broadcast.emit('user:offline', { userId })
      } catch (error) {
        console.error('Error in disconnect:', error)
      }
    })
  })

  const PORT = process.env.PORT || 3000
  
  server.listen(PORT, () => {
    console.log(`> Сервер готов на http://localhost:${PORT}`)
    console.log(`> Socket.IO сервер работает на /api/socket`)
  })
})