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
  console.warn('⚠️  JWT_SECRET not set in environment variables. Using default secret. Please set it in production!')
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
      // Allow the origin that sent the request (important for Docker/Railway)
      origin: true, 
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  })

  // Make io globally available
  global.io = io

  // Auth Middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      console.log('Socket auth: No token')
      return next(new Error('Authentication error'))
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.data.userId = decoded.userId
      next()
    } catch (error) {
      console.error('Socket auth error:', error.message)
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.data.userId
    console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`)

    try {
      socket.join(userId)
      onlineUsers.add(userId)

      await prisma.user.update({
        where: { id: userId },
        data: { status: 'ONLINE', lastSeen: new Date() }
      }).catch(e => console.warn(`Prisma update online failed: ${e.message}`))

      socket.broadcast.emit('user:online', { userId })
      socket.emit('users:online', { userIds: Array.from(onlineUsers) })
    } catch (error) {
      console.error('Error in socket connection setup:', error)
    }

    socket.on('messages:mark-as-read', async (data) => {
      const { conversationId, messageIds } = data
      if (!messageIds || !Array.isArray(messageIds)) return

      console.log(`Marking ${messageIds.length} messages as read in ${conversationId} for ${userId}`)

      try {
        const updatedMessages = []

        // Faster updates: collect all updated messages and then notify
        for (const messageId of messageIds) {
          const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { readBy: true }
          })

          if (message && !message.readBy.includes(userId)) {
            const updated = await prisma.message.update({
              where: { id: messageId },
              data: {
                readBy: {
                  set: [...message.readBy, userId]
                }
              },
              include: {
                sender: {
                  select: { id: true, username: true, avatarUrl: true }
                }
              }
            })
            updatedMessages.push(updated)
          }
        }

        if (updatedMessages.length > 0) {
          const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { users: { select: { id: true } } }
          })

          if (conversation) {
            for (const user of conversation.users) {
              // Notify everyone about EVERY updated message
              for (const updatedMsg of updatedMessages) {
                io.to(user.id).emit('message:updated', updatedMsg)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    })

    socket.on('message:send', async (data) => {
      const { conversationId, content } = data
      console.log(`Message from ${userId} in ${conversationId}: ${content}`)
      
      try {
        const message = await prisma.message.create({
          data: {
            content,
            senderId: userId,
            conversationId,
            readBy: [userId],
          },
          include: {
            sender: {
              select: { id: true, username: true, avatarUrl: true }
            }
          }
        })
        
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { users: { select: { id: true } } }
        })
        
        if (conversation) {
          // Update conversation's updatedAt so it bubbles to top
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
          }).catch(() => {})

          for (const user of conversation.users) {
            // Send to user's room (includes all their open tabs)
            io.to(user.id).emit('message:new', message)
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
              io.to(user.id).emit('typing:start', {
                conversationId,
                userId,
              })
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
              io.to(user.id).emit('typing:stop', {
                conversationId,
                userId
              })
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
    console.log(`> Ready on http://localhost:${PORT}`)
    console.log(`> Socket.IO server running on /api/socket`)
  })
})